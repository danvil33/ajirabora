import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase/config";
import { applyActionCode } from "firebase/auth";
import { FaCheckCircle, FaSpinner, FaExclamationTriangle, FaEnvelope } from "react-icons/fa";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get parameters from URL (Firebase adds these automatically)
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const actionCode = urlParams.get('oobCode');
    const continueUrl = urlParams.get('continueUrl');
    const userEmail = urlParams.get('email');
    
    console.log("VerifyEmail page loaded");
    console.log("Mode:", mode);
    console.log("Has oobCode:", !!actionCode);
    
    if (userEmail) setEmail(userEmail);
    
    // Only process email verification mode
    if (mode === 'verifyEmail' && actionCode) {
      verifyEmail(actionCode);
    } else if (mode === 'recoverEmail') {
      setVerifying(false);
      setResult({
        success: false,
        message: "This link is for email recovery. Please use the password reset flow instead."
      });
    } else if (mode === 'resetPassword') {
      setVerifying(false);
      setResult({
        success: false,
        message: "This link is for password reset. Please use the forgot password page."
      });
    } else {
      setVerifying(false);
      setResult({
        success: false,
        message: "Invalid verification link. Please check your email and click the correct link."
      });
    }
  }, []);

  const verifyEmail = async (actionCode) => {
    try {
      // Apply the verification code - Firebase handles everything!
      await applyActionCode(auth, actionCode);
      
      // Get current user (if still signed in)
      const user = auth.currentUser;
      if (user) {
        // Reload to get updated emailVerified status
        await user.reload();
        setEmail(user.email || "");
      }
      
      setVerifying(false);
      setResult({
        success: true,
        message: "Email verified successfully! You can now login to your account."
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (error) {
      console.error("Verification error:", error);
      
      let errorMessage = "Failed to verify email. ";
      
      switch (error.code) {
        case 'auth/invalid-action-code':
          errorMessage += "The verification link is invalid or has already been used.";
          break;
        case 'auth/expired-action-code':
          errorMessage += "The verification link has expired. Please request a new one.";
          break;
        default:
          errorMessage += error.message || "Please try again.";
      }
      
      setVerifying(false);
      setResult({
        success: false,
        message: errorMessage
      });
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Didn't receive the email or link expired?
              </p>
              <Link 
                to="/login" 
                className="text-[#FF8C00] dark:text-orange-400 hover:underline flex items-center justify-center gap-2 w-full"
              >
                <FaEnvelope /> Go to Login to Resend
              </Link>
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