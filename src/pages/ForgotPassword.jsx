import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import { 
  FaEnvelope, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaSpinner,
  FaArrowLeft
} from "react-icons/fa";
import logo from "../Assets/logo.png";
import AdvancedCaptcha from "../Components/AdvancedCaptcha";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isCaptchaVerified) {
      setError("Please verify you're human by ticking the box.");
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendPasswordResetEmail(auth, cleanEmail, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      setSuccess(
        "Password reset email sent! Check your inbox and spam folder."
      );
      setEmail("");
    } catch (err) {
      console.error("Password reset error:", err);
      
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email address.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address format.");
          break;
        case "auth/too-many-requests":
          setError("Too many requests. Please wait a few minutes.");
          break;
        default:
          setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src={logo} alt="AjiraBora" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reset Password
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Enter your email to receive a password reset link
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <FaExclamationTriangle />
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <FaCheckCircle />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* CAPTCHA */}
            <AdvancedCaptcha onVerify={setIsCaptchaVerified} />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isCaptchaVerified}
              className="w-full bg-[#FF8C00] hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF8C00] dark:hover:text-orange-400 transition-colors"
            >
              <FaArrowLeft className="text-xs" />
              Back to Sign In
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              We'll send a secure link to your email address.
              <br />
              The link will expire in 1 hour.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;