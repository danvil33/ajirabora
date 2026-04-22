import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithGoogle, linkGoogleAccount } from "../services/googleAuthService";
import { signInWithGoogleNative, isNativePlatform } from "../services/nativeGoogleAuth";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaGoogle } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import logo from "../Assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showLinkingOption, setShowLinkingOption] = useState(false);
  const [pendingGoogleEmail, setPendingGoogleEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Function to resend verification email
  const resendVerificationEmail = async () => {
    setResendMessage("");
    setError("");
    
    try {
      // Sign in temporarily to get user object
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        await user.sendEmailVerification();
        setResendMessage("Verification email resent! Please check your inbox.");
        // Sign out until they verify
        await auth.signOut();
      }
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend verification email. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResendMessage("");
    setLoading(true);
    setShowLinkingOption(false);

    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Check if email is verified using Firebase Auth's emailVerified (NOT Firestore!)
      if (!user.emailVerified) {
        // Email not verified - sign out and show error with resend option
        await auth.signOut();
        setError(`Please verify your email before logging in. Check your inbox at ${email} for the verification link.`);
        setLoading(false);
        return;
      }
      
      // 3. Check Firestore user document exists (create if missing for legacy users)
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist (for legacy or edge cases)
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName || email.split('@')[0],
          email: user.email,
          role: "jobseeker",
          emailVerified: true,
          createdAt: new Date().toISOString()
        });
      } else {
        // Update Firestore to match Firebase verification status
        const userData = userDoc.data();
        if (!userData.emailVerified) {
          await setDoc(doc(db, "users", user.uid), { emailVerified: true }, { merge: true });
        }
      }
      
      // 4. Login successful
      setUser(user);
      setSuccess("Login successful! Redirecting...");
      
      setTimeout(() => {
        navigate("/home");
      }, 1500);
      
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (err.code === "auth/user-disabled") {
        setError("This account has been disabled");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message || "Failed to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setResendMessage("");
    setLoading(true);
    setShowLinkingOption(false);
    
    try {
      let result;
      
      // Check if running on native Android APK
      if (isNativePlatform()) {
        result = await signInWithGoogleNative();
      } else {
        result = await signInWithGoogle();
      }
      
      if (result.success) {
        // Check if Google user's email is verified (Google accounts are always verified)
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
          // This shouldn't happen with Google, but just in case
          await user.sendEmailVerification();
          await auth.signOut();
          setError("Please verify your email. A verification link has been sent.");
          setLoading(false);
          return;
        }
        
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/home");
        }, 1500);
      } else {
        if (result.needsLinking) {
          setPendingGoogleEmail(result.email);
          setShowLinkingOption(true);
          setError(`An account already exists with ${result.email}. Would you like to sign in with your password first?`);
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogleAccount = async () => {
    setError("");
    setLoading(true);
    
    try {
      // First sign in with email/password
      const userCredential = await signInWithEmailAndPassword(auth, pendingGoogleEmail, password);
      const user = userCredential.user;
      
      // Check email verification
      if (!user.emailVerified) {
        await auth.signOut();
        setError("Please verify your email before linking Google account.");
        setLoading(false);
        setShowLinkingOption(false);
        return;
      }
      
      // Then link Google account
      const linkResult = await linkGoogleAccount();
      if (linkResult.success) {
        setSuccess("Google account linked successfully! Redirecting...");
        setTimeout(() => {
          navigate("/home");
        }, 1500);
      } else {
        setError(linkResult.error);
      }
    } catch (err) {
      console.error("Link account error:", err);
      if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError("Failed to link Google account. Please try again.");
      }
    } finally {
      setLoading(false);
      setShowLinkingOption(false);
    }
  };

  const handleCancelLinking = () => {
    setShowLinkingOption(false);
    setPendingGoogleEmail("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="AjiraBora" className="h-24 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <FaExclamationTriangle className="text-sm mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
              {/* Resend verification button */}
              {error.includes("verify your email") && (
                <button
                  onClick={resendVerificationEmail}
                  className="mt-2 text-sm text-[#FF8C00] dark:text-orange-400 hover:underline font-medium"
                >
                  Resend verification email →
                </button>
              )}
              {showLinkingOption && pendingGoogleEmail && (
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                  <p className="text-sm mb-2">Sign in with your password to link your Google account:</p>
                  <div className="space-y-2">
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleLinkGoogleAccount}
                        disabled={!password}
                        className="flex-1 bg-[#FF8C00] text-white py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition"
                      >
                        Link & Sign In
                      </button>
                      <button
                        onClick={handleCancelLinking}
                        className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {resendMessage && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <FaCheckCircle /> {resendMessage}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <FaCheckCircle /> {success}
            </div>
          )}

          {!showLinkingOption && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
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
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A2A4A] dark:bg-[#0f1a2e] hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
              >
                {loading ? <><FaSpinner className="animate-spin" /> Signing in...</> : "Sign In"}
              </button>
            </form>
          )}

          {!showLinkingOption && (
            <>
              {/* Register Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 font-semibold">
                    Create Account
                  </Link>
                </p>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <FcGoogle className="text-xl" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sign in with Google</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;