import { db } from "../firebase/config";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, orderBy } from "firebase/firestore";

const jobsRef = collection(db, "jobs");

export const createJob = async (data) => {
  try {
    const docRef = await addDoc(jobsRef, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
};

// For home page - fetches all jobs
export const getJobs = async () => {
  try {
    const q = query(jobsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};

// For employer dashboard - fetches ONLY jobs posted by this employer
export const getEmployerJobs = async (employerId) => {
  try {
    const q = query(
      jobsRef, 
      where("postedBy", "==", employerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    throw error;
  }
};

export const getJobById = async (jobId) => {
  try {
    const jobDoc = doc(db, "jobs", jobId);
    const snap = await getDoc(jobDoc);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching job:", error);
    throw error;
  }
};

export const updateJob = async (jobId, data) => {
  try {
    const jobDoc = doc(db, "jobs", jobId);
    await updateDoc(jobDoc, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: jobId, ...data };
  } catch (error) {
    console.error("Error updating job:", error);
    throw error;
  }
};

export const deleteJob = async (jobId) => {
  try {
    const jobDoc = doc(db, "jobs", jobId);
    await deleteDoc(jobDoc);
    return jobId;
  } catch (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
};