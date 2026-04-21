// src/firebase/config.js

// Import Firebase core and the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdc3Wm3YJq1RD6e3dROEb1gxs8KYatLTE",
  authDomain: "wesocio-b1c78.firebaseapp.com",
  projectId: "wesocio-b1c78",
  storageBucket: "wesocio-b1c78.appspot.com",
  messagingSenderId: "234880016165",
  appId: "1:234880016165:web:bd9063a3b1150b22a144cc",
  measurementId: "G-DH6YYZDHMS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional: Analytics
const analytics = getAnalytics(app);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Add scopes for Google (optional but recommended)
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;