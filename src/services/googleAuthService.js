// src/services/googleAuthService.js
import { auth, googleProvider, db } from "../firebase/config";
import { signInWithPopup, linkWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      // Save new user to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        role: "jobseeker",
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        authProvider: "google"
      });
    }
    
    return { success: true, user };
    
  } catch (error) {
    console.error("Google sign-in error:", error);
    
    // Handle account exists with different credential
    if (error.code === 'auth/account-exists-with-different-credential') {
      const email = error.customData?.email;
      
      return { 
        success: false, 
        error: `An account already exists with ${email}. Please sign in with your password first.`,
        needsLinking: true,
        email: email
      };
    }
    
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: "Sign-in cancelled. Please try again." };
    }
    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: "Popup was blocked. Please allow popups for this site." };
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Link Google account to existing email/password account
 * Call this after user signs in with email/password
 */
export const linkGoogleAccount = async () => {
  try {
    const result = await linkWithPopup(auth.currentUser, googleProvider);
    const user = result.user;
    
    // Update Firestore with Google info
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      photoURL: user.photoURL,
      authProvider: "email+google",
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return { success: true, user };
  } catch (error) {
    console.error("Link Google error:", error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: "Linking cancelled. Please try again." };
    }
    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: "Popup was blocked. Please allow popups for this site." };
    }
    
    return { success: false, error: error.message };
  }
};