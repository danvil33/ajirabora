// src/services/notificationService.js
import { db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { sendBatchJobAlerts } from "./emailService";
import { calculateMatchScore, getMatchReasons } from "./matchingService";

/**
 * Get all job seekers from database
 */
export const getAllJobSeekers = async () => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "jobseeker"));
    const querySnapshot = await getDocs(q);
    
    const jobSeekers = [];
    querySnapshot.forEach((doc) => {
      jobSeekers.push({
        id: doc.id,
        email: doc.data().email,
        name: doc.data().name || "Job Seeker",
        skills: doc.data().skills,
        title: doc.data().title,
        location: doc.data().location,
        experienceLevel: doc.data().experienceLevel,
        salaryExpectation: doc.data().salaryExpectation,
        fcmToken: doc.data().fcmToken,
        phone: doc.data().phone,
        ...doc.data()
      });
    });
    
    return jobSeekers;
  } catch (error) {
    console.error("Error fetching job seekers:", error);
    return [];
  }
};

/**
 * Find job seekers who match a job posting (70%+ match)
 */
export const findMatchingJobSeekers = async (jobData, minMatchScore = 70) => {
  try {
    const allJobSeekers = await getAllJobSeekers();
    
    const matchingSeekers = [];
    
    for (const seeker of allJobSeekers) {
      // Skip if profile is too incomplete for matching
      if (!seeker.skills && !seeker.title) {
        continue;
      }
      
      // Calculate match score
      const matchScore = calculateMatchScore(seeker, jobData);
      
      // Only include if match score meets threshold
      if (matchScore >= minMatchScore) {
        matchingSeekers.push({
          ...seeker,
          matchScore: matchScore,
          matchReasons: getMatchReasons(seeker, jobData, matchScore)
        });
      }
    }
    
    // Sort by match score (highest first)
    matchingSeekers.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log(`Found ${matchingSeekers.length} matching job seekers (${minMatchScore}%+ match)`);
    return matchingSeekers;
    
  } catch (error) {
    console.error("Error finding matching job seekers:", error);
    return [];
  }
};

/**
 * Send new job notification to ALL job seekers (Original - keeps compatibility)
 */
export const notifyAllJobSeekers = async (jobData) => {
  try {
    const jobSeekers = await getAllJobSeekers();
    
    if (jobSeekers.length === 0) {
      console.log("No job seekers found to notify");
      return { sent: 0, failed: 0, total: 0 };
    }
    
    console.log(`Sending job alerts to ${jobSeekers.length} job seekers...`);
    
    const results = await sendBatchJobAlerts(jobSeekers, jobData);
    
    console.log(`✅ Notified ${results.sent} job seekers, Failed: ${results.failed}`);
    return results;
    
  } catch (error) {
    console.error("Error sending notifications:", error);
    return { sent: 0, failed: 0, total: 0 };
  }
};

/**
 * Send job notification ONLY to matching job seekers (70%+ match)
 * This is the NEW function you should use for better targeting
 */
export const notifyMatchingJobSeekers = async (jobData, minMatchScore = 70) => {
  try {
    // Find only matching job seekers
    const matchingSeekers = await findMatchingJobSeekers(jobData, minMatchScore);
    
    if (matchingSeekers.length === 0) {
      console.log(`No matching job seekers found (${minMatchScore}%+ threshold)`);
      return { 
        sent: 0, 
        failed: 0, 
        total: 0, 
        matched: 0,
        message: "No qualified candidates found for this position"
      };
    }
    
    console.log(`Sending targeted job alerts to ${matchingSeekers.length} matching job seekers...`);
    
    // Send emails only to matching seekers
    const results = await sendBatchJobAlerts(matchingSeekers, jobData);
    
    // Also send push notifications to those with FCM tokens
    let pushResults = { sent: 0, failed: 0 };
    const usersWithFCM = matchingSeekers.filter(seeker => seeker.fcmToken);
    
    if (usersWithFCM.length > 0 && typeof sendBatchPushAlerts === 'function') {
      pushResults = await sendBatchPushAlerts(usersWithFCM, jobData);
    }
    
    return {
      email: results,
      push: pushResults,
      total: matchingSeekers.length,
      matchScores: matchingSeekers.map(s => ({ name: s.name, score: s.matchScore }))
    };
    
  } catch (error) {
    console.error("Error sending matching notifications:", error);
    return { sent: 0, failed: 0, total: 0, matched: 0 };
  }
};

/**
 * Get match summary for a job (how many qualified candidates)
 */
export const getJobMatchSummary = async (jobData) => {
  try {
    const matchingSeekers = await findMatchingJobSeekers(jobData, 70);
    
    return {
      totalQualified: matchingSeekers.length,
      averageMatchScore: matchingSeekers.length > 0 
        ? Math.round(matchingSeekers.reduce((sum, s) => sum + s.matchScore, 0) / matchingSeekers.length)
        : 0,
      topMatches: matchingSeekers.slice(0, 5).map(s => ({
        name: s.name,
        score: s.matchScore,
        skills: s.skills
      }))
    };
    
  } catch (error) {
    console.error("Error getting match summary:", error);
    return { totalQualified: 0, averageMatchScore: 0, topMatches: [] };
  }
};