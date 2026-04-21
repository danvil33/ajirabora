import { db } from "../firebase/config";
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

// Save user profile
export const saveUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return { id: userId, ...profileData };
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return { id: userId, ...updates };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Get all employers (for admin)
export const getEmployers = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "employer"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching employers:", error);
    return [];
  }
};

// Check if profile is complete for job seekers
export const isProfileComplete = (profile) => {
  if (!profile) return false;
  const requiredFields = ['name', 'phone', 'location', 'education'];
  return requiredFields.every(field => profile[field] && profile[field].trim() !== '');
};

// Check if user is employer
export const isEmployer = (profile) => {
  return profile?.role === "employer";
};

// Check if user is job seeker
export const isJobSeeker = (profile) => {
  return profile?.role === "jobseeker";
};