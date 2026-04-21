import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { updateEmail } from "firebase/auth";
import { FaCheckCircle, FaSpinner, FaExclamationTriangle, FaEnvelope } from "react-icons/fa";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState(null);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get verification code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const verificationCode = urlParams.get('code');
    
    if (verificationCode) {
      verifyEmail(verificationCode);
    } else {
      setVerifying(false);
      setResult({ 
        success: false, 
        message: "No verification code found. Please check your email link." 
      });
    }
  }, []);

  const verifyEmail = async (code) => {
    try {
      // Find the verification document with this code
      const verificationsRef = collection(db, 'emailVerifications');
      const q = query(verificationsRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setVerifying(false);
        setResult({ 
          success: false, 
          message: "Invalid verification link. Please request a new one." 
        });
        return;
      }
      
      const verificationDoc = querySnapshot.docs[0];
      const verificationData = verificationDoc.data();
      const userId = verificationDoc.id;
      
      // Check if already verified
      if (verificationData.verified) {
        setVerifying(false);
        setResult({ 
          success: false, 
          message: "Email already verified. You can login now." 
        });
        return;
      }
      
      // Check if expired
      if (Date.now() > verificationData.expiresAt) {
        setVerifying(false);
        setResult({ 
          success: false, 
          message: "Verification link has expired. Please request a new one." 
        });
        return;
      }
      
      // Update verification status in emailVerifications collection
      await updateDoc(doc(db, 'emailVerifications', userId), {
        verified: true,
        verifiedAt: new Date().toISOString()
      });
      
      // Update user profile in users collection
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          emailVerified: true,
          verifiedAt: new Date().toISOString()
        });
        setEmail(userDoc.data().email);
      }
      
      // Try to update Firebase Auth user's emailVerified property
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await auth.currentUser.reload();
      }
      
      setVerifying(false);
      setResult({ 
        success: true, 
        message: "Email verified successfully! You can now login." 
      });
      
    } catch (error) {
      console.error("Verification error:", error);
      setVerifying(false);
      setResult({ 
        success: false, 
        message: error.message || "Failed to verify email. Please try again." 
      });
    }
  };

  const handleResendEmail = async () => {
    // Get email from URL or prompt user
    const urlParams = new URLSearchParams(window.location.search);
    let userEmail = urlParams.get('email');
    
    if (!userEmail) {
      userEmail = prompt("Please enter your email address to resend verification link:");
    }
    
    if (!userEmail) return;
    
    setResending(true);
    
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("No account found with this email address.");
        setResending(false);
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Check if already verified
      if (userData.emailVerified) {
        alert("Email already verified! You can login.");
        setResending(false);
        return;
      }
      
      // Generate new verification code
      const newCode = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const newLink = `${window.location.origin}/verify-email?code=${newCode}`;
      
      // Update verification document
      const verificationRef = doc(db, 'emailVerifications', userId);
      await updateDoc(verificationRef, {
        code: newCode,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        verified: false,
        updatedAt: new Date().toISOString()
      });
      
      // Import and send email
      const { sendVerificationEmail } = await import('../services/emailService');
      const emailResult = await sendVerificationEmail(
        userEmail,
        userData.name || "User",
        newLink
      );
      
      if (emailResult.success) {
        alert(`Verification email resent to ${userEmail}. Please check your inbox.`);
      } else {
        alert("Failed to send email. Please try again.");
      }
      
    } catch (error) {
      console.error("Resend error:", error);
      alert("Failed to resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-[#FF8C00] dark:text-orange-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        {result?.success ? (
          <>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-4xl text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified! ✅
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {result.message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You can now login and start using AjiraBora.
            </p>
            <Link 
              to="/login" 
              className="inline-block bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white px-6 py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors"
            >
              Go to Login
            </Link>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-4xl text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {result?.message || "Unable to verify your email. The link may be expired or invalid."}
            </p>
            
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="text-[#FF8C00] dark:text-orange-400 hover:underline flex items-center justify-center gap-2 w-full"
              >
                {resending ? <FaSpinner className="animate-spin" /> : <FaEnvelope />}
                {resending ? "Sending..." : "Resend Verification Email"}
              </button>
            </div>
            
            <Link 
              to="/login" 
              className="mt-6 inline-block bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white px-6 py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;