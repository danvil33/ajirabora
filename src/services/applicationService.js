import { db } from "../firebase/config";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, getDoc, orderBy } from "firebase/firestore";

const applicationsRef = collection(db, "applications");

// Submit a job application
export const submitApplication = async (applicationData) => {
  try {
    console.log("Submitting application:", applicationData);
    const docRef = await addDoc(applicationsRef, {
      ...applicationData,
      appliedAt: new Date().toISOString(),
      status: "pending",
      updatedAt: new Date().toISOString()
    });
    console.log("Application submitted with ID:", docRef.id);
    return { id: docRef.id, ...applicationData };
  } catch (error) {
    console.error("Error submitting application:", error);
    throw error;
  }
};

// Get applications by a specific user
export const getApplicationsByUser = async (userId) => {
  try {
    if (!userId) {
      console.error("No userId provided");
      return [];
    }
    
    console.log("Querying applications for userId:", userId);
    
    const q = query(applicationsRef, where("userId", "==", userId));
    const snap = await getDocs(q);
    console.log("Query result size:", snap.size);
    
    const applications = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    
    console.log("Applications found:", applications.length);
    return applications;
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return [];
  }
};

// Get applications for a specific job
export const getApplicationsByJob = async (jobId) => {
  try {
    if (!jobId) return [];
    
    const q = query(applicationsRef, where("jobId", "==", jobId));
    const snap = await getDocs(q);
    
    const applications = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    
    return applications;
  } catch (error) {
    console.error("Error fetching applications by job:", error);
    return [];
  }
};

// Get application by ID
export const getApplicationById = async (applicationId) => {
  try {
    const appDoc = doc(db, "applications", applicationId);
    const snap = await getDoc(appDoc);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching application:", error);
    return null;
  }
};

// Update application status
export const updateApplicationStatus = async (applicationId, status, feedback = "") => {
  try {
    const appDoc = doc(db, "applications", applicationId);
    await updateDoc(appDoc, {
      status: status,
      feedback: feedback,
      updatedAt: new Date().toISOString()
    });
    return { id: applicationId, status, feedback };
  } catch (error) {
    console.error("Error updating application:", error);
    throw error;
  }
};

// Check if user already applied to a job
export const hasUserApplied = async (userId, jobId) => {
  try {
    if (!userId || !jobId) {
      console.log("Missing userId or jobId");
      return false;
    }
    
    console.log("Checking if user applied:", userId, "for job:", jobId);
    const q = query(
      applicationsRef, 
      where("userId", "==", userId), 
      where("jobId", "==", jobId)
    );
    const snap = await getDocs(q);
    console.log("Already applied?", !snap.empty);
    return !snap.empty;
  } catch (error) {
    console.error("Error checking application:", error);
    return false;
  }
};

// Withdraw application
export const withdrawApplication = async (applicationId) => {
  try {
    const appDoc = doc(db, "applications", applicationId);
    await deleteDoc(appDoc);
    return true;
  } catch (error) {
    console.error("Error withdrawing application:", error);
    throw error;
  }
};

// ========== NEW FUNCTIONS FOR INTERVIEWS & SELECTION ==========

// Schedule/Update interview for an application
export const scheduleInterview = async (applicationId, interviewData) => {
  try {
    const appDoc = doc(db, "applications", applicationId);
    await updateDoc(appDoc, {
      interview: {
        scheduled: true,
        date: interviewData.date,
        time: interviewData.time,
        type: interviewData.type, // 'in-person', 'phone', 'video'
        location: interviewData.location || "",
        link: interviewData.link || "",
        instructions: interviewData.instructions || "",
        status: 'pending', // pending, confirmed, completed, cancelled
        scheduledBy: interviewData.scheduledBy,
        scheduledByEmail: interviewData.scheduledByEmail,
        scheduledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error scheduling interview:", error);
    throw error;
  }
};

// Update interview status (candidate confirms)
export const confirmInterview = async (applicationId, candidateMessage) => {
  try {
    const appDoc = doc(db, "applications", applicationId);
    await updateDoc(appDoc, {
      'interview.status': 'confirmed',
      'interview.candidateMessage': candidateMessage,
      'interview.confirmedAt': new Date().toISOString(),
      'interview.updatedAt': new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error confirming interview:", error);
    throw error;
  }
};

// Add selection comment/feedback (UPDATED - matches the import name)
export const addSelectionComment = async (applicationId, comment, selectionStatus) => {
  try {
    const appDoc = doc(db, "applications", applicationId);
    await updateDoc(appDoc, {
      selectionStatus: selectionStatus, // 'shortlisted', 'selected', 'rejected', 'on-hold'
      selectionComment: comment,
      selectionUpdatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error adding selection comment:", error);
    throw error;
  }
};

// Cancel interview
export const cancelInterview = async (applicationId, reason) => {
  try {
    const appDoc = doc(db, "applications", applicationId);
    await updateDoc(appDoc, {
      'interview.status': 'cancelled',
      'interview.cancelReason': reason,
      'interview.cancelledAt': new Date().toISOString(),
      'interview.updatedAt': new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error cancelling interview:", error);
    throw error;
  }
};

// Add interview feedback after completion
export const addInterviewFeedback = async (applicationId, feedback, rating) => {
  try {
    const appDoc = doc(db, "applications", applicationId);
    await updateDoc(appDoc, {
      'interview.feedback': feedback,
      'interview.rating': rating,
      'interview.completedAt': new Date().toISOString(),
      'interview.updatedAt': new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error adding feedback:", error);
    throw error;
  }
};

// Reschedule interview
export const rescheduleInterview = async (applicationId, newDate, newTime, reason) => {
  try {
    const appDoc = doc(db, "applications", applicationId);
    await updateDoc(appDoc, {
      'interview.date': newDate,
      'interview.time': newTime,
      'interview.status': 'reschedule_requested',
      'interview.rescheduleReason': reason,
      'interview.rescheduleRequestedAt': new Date().toISOString(),
      'interview.updatedAt': new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error rescheduling interview:", error);
    throw error;
  }
};