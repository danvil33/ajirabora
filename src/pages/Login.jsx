import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithGoogle, linkGoogleAccount } from "../services/googleAuthService";
import { signInWithGoogleNative, isNativePlatform } from "../services/nativeGoogleAuth";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaGoogle, FaBriefcase, FaUserTie } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import logo from "../Assets/logo.png";
import poster from "../Assets/poster.png";

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
      
      // 2. Check if email is verified using Firebase Auth's emailVerified
      if (!user.emailVerified) {
        await auth.signOut();
        setError(`Please verify your email before logging in. Check your inbox at ${email} for the verification link.`);
        setLoading(false);
        return;
      }
      
      // 3. Check Firestore user document exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName || email.split('@')[0],
          email: user.email,
          role: "jobseeker",
          emailVerified: true,
          createdAt: new Date().toISOString()
        });
      } else {
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
      
      if (isNativePlatform()) {
        result = await signInWithGoogleNative();
      } else {
        result = await signInWithGoogle();
      }
      
      if (result.success) {
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
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
      const userCredential = await signInWithEmailAndPassword(auth, pendingGoogleEmail, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        await auth.signOut();
        setError("Please verify your email before linking Google account.");
        setLoading(false);
        setShowLinkingOption(false);
        return;
      }
      
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
      <div className="max-w-5xl w-full">
        <div className="flex flex-col md:flex-row rounded-2xl shadow-xl overflow-hidden">
          
          {/* Left Side - Image Section (Hidden on mobile, visible on md+) */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#1A2A4A] to-[#2a3d6e] relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#FF8C00] rounded-full opacity-10 blur-2xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#FF8C00] rounded-full opacity-10 blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
            
            {/* Image */}
            <div className="relative z-10 flex flex-col justify-center items-center p-8 w-full h-full">
              <img 
                src={poster} 
                alt="AjiraBora - Find your dream job" 
                className="w-full h-auto object-contain rounded-2xl max-h-[500px]"
              />
              
              {/* Quote overlay */}
              <div className="mt-6 text-center">
                <h3 className="text-white text-xl font-bold mb-2">Welcome Back!</h3>
                <p className="text-gray-300 text-sm">Continue your journey with AjiraBora</p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    <FaBriefcase className="text-[#FF8C00] text-xs" />
                    <span className="text-white text-xs">1,000+ Jobs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaUserTie className="text-[#FF8C00] text-xs" />
                    <span className="text-white text-xs">500+ Employers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="w-full md:w-1/2 bg-white dark:bg-slate-800 p-6 sm:p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <img src={logo} alt="AjiraBora" className="h-24 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-sm mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
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

                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 hover:underline">
                    Forgot password?
                  </Link>
                </div>

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
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 font-semibold">
                      Create Account
                    </Link>
                  </p>
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                  </div>
                </div>

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
    </div>
  );
};

export default Login;