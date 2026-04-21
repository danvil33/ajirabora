import { auth } from "../firebase/config";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";

export const signup = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    return await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    return await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};