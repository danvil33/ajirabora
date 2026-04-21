// src/services/matchingService.js
import { db } from "../firebase/config";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, arrayUnion } from "firebase/firestore";

// WEIGHTED SCORING SYSTEM (TOTAL: 100%)
const WEIGHTS = {
  SKILLS: 0.35,        // 35% - Most important
  EXPERIENCE: 0.20,    // 20%
  JOB_TITLE: 0.15,     // 15%
  LOCATION: 0.15,      // 15%
  SALARY: 0.10,        // 10%
  COMPANY_SIZE: 0.05   // 5% - New factor
};

/**
 * Advanced Skills Matching - Semantic matching
 */
const calculateSkillsMatch = (userSkills, jobSkills) => {
  if (!userSkills || !jobSkills || jobSkills.length === 0) return 0;
  
  const userSkillArray = userSkills.toLowerCase().split(',').map(s => s.trim());
  const jobSkillArray = jobSkills.map(s => s.toLowerCase().trim());
  
  // Exact matches
  let exactMatches = 0;
  let partialMatches = 0;
  let semanticMatches = 0;
  
  for (const userSkill of userSkillArray) {
    for (const jobSkill of jobSkillArray) {
      if (userSkill === jobSkill) {
        exactMatches++;
      } else if (jobSkill.includes(userSkill) || userSkill.includes(jobSkill)) {
        partialMatches++;
      }
      // Semantic matching for related skills
      else if (isRelatedSkill(userSkill, jobSkill)) {
        semanticMatches++;
      }
    }
  }
  
  // Weighted scoring: exact (1.0), partial (0.6), semantic (0.3)
  const totalScore = (exactMatches * 1.0) + (partialMatches * 0.6) + (semanticMatches * 0.3);
  const maxPossible = jobSkillArray.length;
  
  return Math.min(1, totalScore / maxPossible);
};

/**
 * Semantic skill relationships
 */
const isRelatedSkill = (skill1, skill2) => {
  const relationships = {
    'react': ['javascript', 'frontend', 'web development', 'jsx'],
    'javascript': ['react', 'node', 'typescript', 'ecmascript'],
    'python': ['django', 'flask', 'data science', 'machine learning'],
    'node': ['javascript', 'backend', 'express', 'api'],
    'java': ['spring', 'android', 'kotlin'],
    'sql': ['database', 'mysql', 'postgresql', 'mongodb'],
    'mongodb': ['database', 'nosql', 'mongoose'],
    'docker': ['kubernetes', 'container', 'devops'],
    'aws': ['cloud', 'azure', 'gcp', 'devops']
  };
  
  const skill1Lower = skill1.toLowerCase();
  const skill2Lower = skill2.toLowerCase();
  
  return relationships[skill1Lower]?.includes(skill2Lower) ||
         relationships[skill2Lower]?.includes(skill1Lower) ||
         false;
};

/**
 * Calculate Experience Match
 */
const calculateExperienceMatch = (userExp, jobLevel) => {
  if (!userExp || !jobLevel) return 0.5;
  
  const expLevels = {
    "Beginner": 1,
    "Intermediate": 2,
    "Experienced": 3,
    "Professional": 4
  };
  
  const userExpLevel = expLevels[userExp] || 2;
  const jobExpLevel = expLevels[jobLevel] || 2;
  
  if (userExpLevel >= jobExpLevel) return 1.0;
  if (userExpLevel === jobExpLevel - 1) return 0.6;
  return 0.3;
};

/**
 * Calculate Title Match with synonyms
 */
const calculateTitleMatch = (userTitle, jobTitle) => {
  if (!userTitle || !jobTitle) return 0;
  
  const userWords = userTitle.toLowerCase().split(' ');
  const jobWords = jobTitle.toLowerCase().split(' ');
  
  const synonyms = {
    'developer': ['engineer', 'programmer', 'coder', 'software developer'],
    'engineer': ['developer', 'programmer', 'software engineer'],
    'designer': ['ui designer', 'ux designer', 'graphic designer'],
    'manager': ['lead', 'head', 'director', 'supervisor'],
    'analyst': ['data analyst', 'business analyst', 'analytics']
  };
  
  let matchScore = 0;
  
  for (const userWord of userWords) {
    for (const jobWord of jobWords) {
      if (userWord === jobWord) {
        matchScore += 1.0;
      } else if (synonyms[userWord]?.includes(jobWord) || synonyms[jobWord]?.includes(userWord)) {
        matchScore += 0.7;
      } else if (userWord.includes(jobWord) || jobWord.includes(userWord)) {
        matchScore += 0.4;
      }
    }
  }
  
  return Math.min(1, matchScore / Math.max(userWords.length, 1));
};

/**
 * Calculate Location Match
 */
const calculateLocationMatch = (userLocation, jobLocation) => {
  if (!userLocation || !jobLocation) return 0.5;
  
  const userLoc = userLocation.toLowerCase();
  const jobLoc = jobLocation.toLowerCase();
  
  if (userLoc === jobLoc) return 1.0;
  if (userLoc.includes(jobLoc) || jobLoc.includes(userLoc)) return 0.7;
  
  // Tanzania-specific location matching
  const tanzaniaRegions = {
    'dar': ['dar es salaam', 'dsm', 'dar city'],
    'arusha': ['arusha city', 'arusha region'],
    'mbeya': ['mbeya city', 'mbeya region'],
    'mwanza': ['mwanza city', 'mwanza region']
  };
  
  for (const [region, aliases] of Object.entries(tanzaniaRegions)) {
    if ((userLoc.includes(region) && aliases.includes(jobLoc)) ||
        (jobLoc.includes(region) && aliases.includes(userLoc))) {
      return 0.8;
    }
  }
  
  return 0.3;
};

/**
 * Calculate Salary Match
 */
const calculateSalaryMatch = (userSalary, jobSalary) => {
  if (!userSalary || !jobSalary) return 0.5;
  
  const userSal = parseFloat(userSalary);
  const jobSal = parseFloat(jobSalary.toString().replace(/[^0-9]/g, ''));
  
  if (isNaN(userSal) || isNaN(jobSal)) return 0.5;
  
  if (jobSal >= userSal * 1.2) return 1.0;
  if (jobSal >= userSal) return 0.9;
  if (jobSal >= userSal * 0.8) return 0.7;
  if (jobSal >= userSal * 0.6) return 0.5;
  return 0.3;
};

/**
 * Calculate Company Size Match (Bonus factor)
 */
const calculateCompanySizeMatch = (userPref, companySize) => {
  if (!userPref || !companySize) return 0.5;
  
  const sizeLevels = {
    '1-10': 1,
    '11-50': 2,
    '51-200': 3,
    '201-500': 4,
    '500+': 5
  };
  
  const prefLevel = sizeLevels[userPref] || 3;
  const compLevel = sizeLevels[companySize] || 3;
  
  if (Math.abs(prefLevel - compLevel) <= 1) return 1.0;
  if (Math.abs(prefLevel - compLevel) <= 2) return 0.7;
  return 0.4;
};

/**
 * Main match score calculation
 */
export const calculateMatchScore = (userProfile, job) => {
  let score = 0;
  
  // Skills (35%)
  score += calculateSkillsMatch(userProfile.skills, job.requiredSkills) * WEIGHTS.SKILLS;
  
  // Experience (20%)
  score += calculateExperienceMatch(userProfile.experienceLevel, job.level) * WEIGHTS.EXPERIENCE;
  
  // Job Title (15%)
  score += calculateTitleMatch(userProfile.title, job.title) * WEIGHTS.JOB_TITLE;
  
  // Location (15%)
  score += calculateLocationMatch(userProfile.location, job.location) * WEIGHTS.LOCATION;
  
  // Salary (10%)
  score += calculateSalaryMatch(userProfile.salaryExpectation, job.salary) * WEIGHTS.SALARY;
  
  // Company Size (5%) - if user has preference
  if (userProfile.preferredCompanySize) {
    score += calculateCompanySizeMatch(userProfile.preferredCompanySize, job.companySize) * WEIGHTS.COMPANY_SIZE;
  } else {
    score += 0.05; // Default 5% if no preference
  }
  
  // Convert to percentage
  return Math.min(100, Math.round(score * 100));
};

/**
 * Get detailed match breakdown for display
 */
export const getMatchBreakdown = (userProfile, job) => {
  return {
    skills: {
      score: Math.round(calculateSkillsMatch(userProfile.skills, job.requiredSkills) * 35),
      max: 35,
      details: "Your skills match this role's requirements"
    },
    experience: {
      score: Math.round(calculateExperienceMatch(userProfile.experienceLevel, job.level) * 20),
      max: 20,
      details: "Experience level " + (userProfile.experienceLevel === job.level ? "matches perfectly" : "is close to requirement")
    },
    title: {
      score: Math.round(calculateTitleMatch(userProfile.title, job.title) * 15),
      max: 15,
      details: "Job title aligns with your profile"
    },
    location: {
      score: Math.round(calculateLocationMatch(userProfile.location, job.location) * 15),
      max: 15,
      details: "Location " + (userProfile.location === job.location ? "matches exactly" : "is in same region")
    },
    salary: {
      score: Math.round(calculateSalaryMatch(userProfile.salaryExpectation, job.salary) * 10),
      max: 10,
      details: "Salary meets your expectations"
    }
  };
};

/**
 * Get recommendation reasons for display
 */
export const getMatchReasons = (userProfile, job, score) => {
  const reasons = [];
  
  const skillsMatch = calculateSkillsMatch(userProfile.skills, job.requiredSkills);
  if (skillsMatch >= 0.7) {
    reasons.push("✅ Your skills are an excellent fit");
  } else if (skillsMatch >= 0.4) {
    reasons.push("⚠️ Some skills match, consider upgrading");
  } else {
    reasons.push("❌ Significant skills gap detected");
  }
  
  const expMatch = calculateExperienceMatch(userProfile.experienceLevel, job.level);
  if (expMatch >= 0.8) {
    reasons.push("✅ Experience level matches requirement");
  } else if (expMatch >= 0.5) {
    reasons.push("⚠️ Close to experience requirement");
  }
  
  if (userProfile.location && job.location && 
      userProfile.location.toLowerCase() === job.location.toLowerCase()) {
    reasons.push("📍 Location matches your preference");
  }
  
  const salaryMatch = calculateSalaryMatch(userProfile.salaryExpectation, job.salary);
  if (salaryMatch >= 0.8) {
    reasons.push("💰 Salary meets your expectations");
  } else if (salaryMatch >= 0.6) {
    reasons.push("💰 Salary is competitive");
  }
  
  return reasons;
};

/**
 * Get recommended jobs with threshold filtering
 */
export const getRecommendedJobs = async (userId, allJobs, limit = 6, minScore = 70) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    const userProfile = userDoc.data();
    
    if (!userProfile) return allJobs.slice(0, limit);
    
    // Calculate scores for all jobs
    const scoredJobs = allJobs.map(job => ({
      ...job,
      matchScore: calculateMatchScore(userProfile, job),
      matchBreakdown: getMatchBreakdown(userProfile, job),
      matchReasons: getMatchReasons(userProfile, job, calculateMatchScore(userProfile, job))
    }));
    
    // Filter by minimum score (ONLY show jobs above threshold)
    const filteredJobs = scoredJobs.filter(job => job.matchScore >= minScore);
    
    // Sort by score (highest first)
    filteredJobs.sort((a, b) => b.matchScore - a.matchScore);
    
    // Track recommendations for learning (optional)
    await trackRecommendation(userId, filteredJobs.slice(0, limit));
    
    return filteredJobs.slice(0, limit);
    
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return allJobs.slice(0, limit);
  }
};

/**
 * Track recommendations for future improvement
 */
const trackRecommendation = async (userId, recommendedJobs) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastRecommendations: recommendedJobs.map(job => ({
        jobId: job.id,
        score: job.matchScore,
        recommendedAt: new Date().toISOString()
      })),
      recommendationHistory: arrayUnion({
        date: new Date().toISOString(),
        count: recommendedJobs.length
      })
    }).catch(() => {});
  } catch (error) {
    // Silently fail - tracking is optional
  }
};

/**
 * User feedback learning - improve future recommendations
 */
export const recordUserFeedback = async (userId, jobId, liked, reason = null) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      feedbackHistory: arrayUnion({
        jobId,
        liked,
        reason,
        timestamp: new Date().toISOString()
      })
    });
    return { success: true };
  } catch (error) {
    console.error("Error recording feedback:", error);
    return { success: false };
  }
};

/**
 * Get AI Readiness Score
 */
export const getAIReadinessScore = (userProfile) => {
  if (!userProfile) return 0;
  
  const requiredFields = {
    skills: userProfile.skills ? 30 : 0,
    title: userProfile.title ? 25 : 0,
    location: userProfile.location ? 20 : 0,
    experienceLevel: userProfile.experienceLevel ? 15 : 0,
    salaryExpectation: userProfile.salaryExpectation ? 10 : 0
  };
  
  return Object.values(requiredFields).reduce((a, b) => a + b, 0);
};

export const isProfileReadyForAI = (userProfile) => {
  if (!userProfile) return false;
  return !!(userProfile.skills && userProfile.title && userProfile.location && userProfile.experienceLevel);
};