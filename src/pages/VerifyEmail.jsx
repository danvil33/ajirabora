import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase/config";
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { FaCheckCircle, FaSpinner, FaExclamationTriangle, FaEnvelope, FaLock } from "react-icons/fa";
import logo from "../Assets/logo.png";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("");

  useEffect(() => {
    // Get parameters from URL (Firebase adds these automatically)
    const urlParams = new URLSearchParams(window.location.search);
    const actionMode = urlParams.get('mode');
    const actionCode = urlParams.get('oobCode');
    const continueUrl = urlParams.get('continueUrl');
    const userEmail = urlParams.get('email');
    
    console.log("Action page loaded");
    console.log("Mode:", actionMode);
    console.log("Has oobCode:", !!actionCode);
    
    if (userEmail) setEmail(userEmail);
    if (actionMode) setMode(actionMode);
    
    if (!actionCode) {
      setVerifying(false);
      setResult({
        success: false,
        message: "Invalid action link. Please check your email and click the correct link."
      });
      return;
    }
    
    // Handle different action modes
    switch (actionMode) {
      case 'verifyEmail':
        handleVerifyEmail(actionCode);
        break;
      case 'resetPassword':
        handleResetPassword(actionCode);
        break;
      case 'recoverEmail':
        handleRecoverEmail(actionCode);
        break;
      default:
        setVerifying(false);
        setResult({
          success: false,
          message: `Unknown action type: ${actionMode}. Please check your email for the correct link.`
        });
    }
  }, []);

  const handleVerifyEmail = async (actionCode) => {
    try {
      await applyActionCode(auth, actionCode);
      
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        setEmail(user.email || "");
      }
      
      setVerifying(false);
      setResult({
        success: true,
        title: "Email Verified! ✅",
        message: "Your email has been verified successfully! You can now login to your account.",
        action: "Go to Login",
        actionLink: "/login"
      });
      
      setTimeout(() => navigate("/login"), 3000);
      
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
        title: "Verification Failed",
        message: errorMessage,
        action: "Back to Login",
        actionLink: "/login"
      });
    }
  };

  const handleResetPassword = async (actionCode) => {
    try {
      // Verify the code and get the email
      const userEmail = await verifyPasswordResetCode(auth, actionCode);
      setEmail(userEmail);
      
      setVerifying(false);
      setResult({
        success: true,
        title: "Password Reset",
        message: `Please enter your new password for ${userEmail}`,
        action: "Reset Password",
        actionLink: "/reset-password",
        showPasswordForm: true,
        oobCode: actionCode
      });
      
    } catch (error) {
      console.error("Reset password error:", error);
      
      let errorMessage = "Failed to verify reset link. ";
      switch (error.code) {
        case 'auth/invalid-action-code':
          errorMessage += "The reset link is invalid or has already been used.";
          break;
        case 'auth/expired-action-code':
          errorMessage += "The reset link has expired. Please request a new one.";
          break;
        default:
          errorMessage += error.message || "Please try again.";
      }
      
      setVerifying(false);
      setResult({
        success: false,
        title: "Reset Link Invalid",
        message: errorMessage,
        action: "Request New Link",
        actionLink: "/forgot-password"
      });
    }
  };

  const handleRecoverEmail = async (actionCode) => {
    try {
      await applyActionCode(auth, actionCode);
      
      setVerifying(false);
      setResult({
        success: true,
        title: "Email Recovered! ✅",
        message: "Your email has been successfully recovered.",
        action: "Go to Login",
        actionLink: "/login"
      });
      
      setTimeout(() => navigate("/login"), 3000);
      
    } catch (error) {
      console.error("Recover email error:", error);
      
      setVerifying(false);
      setResult({
        success: false,
        title: "Recovery Failed",
        message: "Failed to recover email. The link may be expired or invalid.",
        action: "Back to Login",
        actionLink: "/login"
      });
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-[#FF8C00] dark:text-orange-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Processing your request...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        {/* Logo */}
        <div className="mb-6">
          <img src={logo} alt="AjiraBora" className="h-12 mx-auto" />
        </div>

        {result?.success ? (
          <>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-4xl text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {result.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {result.message}
            </p>
            
            {result.showPasswordForm ? (
              <PasswordResetForm oobCode={result.oobCode} email={email} onSuccess={() => navigate("/login")} />
            ) : (
              <Link 
                to={result.actionLink} 
                className="inline-block bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white px-6 py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors"
              >
                {result.action}
              </Link>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-4xl text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {result?.title || "Action Failed"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {result?.message || "Unable to process your request. The link may be expired or invalid."}
            </p>
            
            <Link 
              to={result?.actionLink || "/login"} 
              className="inline-block bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white px-6 py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors"
            >
              {result?.action || "Back to Login"}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

// Password Reset Form Component
const PasswordResetForm = ({ oobCode, email, onSuccess }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError("Please enter a new password");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setError("Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-4">
        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4">
          Password reset successfully! Redirecting to login...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 text-left">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Reset password for: <span className="font-semibold">{email}</span>
      </p>
      
      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
            placeholder="Enter new password"
            required
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
            placeholder="Confirm new password"
            required
          />
        </div>
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-xs text-[#FF8C00] mt-1"
        >
          {showPassword ? "Hide" : "Show"} password
        </button>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#FF8C00] hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <FaSpinner className="animate-spin mx-auto" /> : "Reset Password"}
      </button>
    </form>
  );
};

export default VerifyEmail;