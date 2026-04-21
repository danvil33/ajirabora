import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { sendVerificationEmail } from "../services/emailService";
import logo from "../assets/logo.png";
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaBriefcase, 
  FaUserTie,
  FaBuilding,
  FaPhone,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaSpinner
} from "react-icons/fa";

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Account Info
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "jobseeker",
    agreeTerms: false,
    
    // Employer-specific fields
    companyName: "",
    companyWebsite: "",
    companyPhone: "",
    companyAddress: "",
    companyDescription: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
    setError("");
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email address is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!formData.agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.role === "employer") {
      if (!formData.companyName.trim()) {
        setError("Company name is required for employers");
        return false;
      }
      if (!formData.companyPhone.trim()) {
        setError("Company phone is required");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setError("");
    }
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError("");

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const user = userCredential.user;
      
      // 2. Update profile with name
      await updateProfile(user, { displayName: formData.name });
      
      // 3. Save user data to Firestore
      const profileData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        agreedToTerms: true,
        agreedAt: new Date().toISOString()
      };
      
      if (formData.role === "employer") {
        profileData.companyName = formData.companyName;
        profileData.companyWebsite = formData.companyWebsite;
        profileData.companyPhone = formData.companyPhone;
        profileData.companyAddress = formData.companyAddress;
        profileData.companyDescription = formData.companyDescription;
      }
      
      await setDoc(doc(db, "users", user.uid), profileData);
      
      // 4. Generate verification code
      const verificationCode = `${user.uid}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const verificationLink = `${window.location.origin}/verify-email?code=${verificationCode}`;
      
      // 5. Store verification data in Firestore
      await setDoc(doc(db, "emailVerifications", user.uid), {
        code: verificationCode,
        email: formData.email,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        verified: false,
        createdAt: new Date().toISOString()
      });
      
      // 6. Send verification email via Brevo SMTP
      const emailResult = await sendVerificationEmail(
        formData.email,
        formData.name,
        verificationLink
      );
      
      if (emailResult.success) {
        setVerificationEmail(formData.email);
        setVerificationSent(true);
        setUser(user);
      } else {
        setError("Account created but failed to send verification email. Please contact support.");
      }
      
    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email already registered. Please login instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show verification screen after registration
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="text-3xl text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We've sent a verification email to:
          </p>
          <p className="font-semibold text-gray-900 dark:text-white mb-4">
            {verificationEmail}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Please check your inbox and click the verification link to activate your account.
            The link expires in 24 hours.
          </p>
          <Link 
            to="/login" 
            className="inline-block bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white px-6 py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="JobPortal" className="h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Join AjiraBora to start your career journey</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="flex justify-between mb-6">
            <div className={`flex-1 text-center ${step >= 1 ? 'text-[#FF8C00] dark:text-orange-400' : 'text-gray-400 dark:text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${step >= 1 ? 'bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                1
              </div>
              <span className="text-xs mt-1 block">Account Info</span>
            </div>
            <div className={`flex-1 text-center ${step >= 2 ? 'text-[#FF8C00] dark:text-orange-400' : 'text-gray-400 dark:text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${step >= 2 ? 'bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                2
              </div>
              <span className="text-xs mt-1 block">Profile Details</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <FaCheckCircle /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: "jobseeker"})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.role === "jobseeker"
                          ? "border-[#FF8C00] dark:border-orange-400 bg-orange-50 dark:bg-orange-950/20"
                          : "border-gray-200 dark:border-slate-700 hover:border-[#FF8C00] dark:hover:border-orange-400"
                      }`}
                    >
                      <FaUser className="text-xl mx-auto mb-1 text-[#FF8C00] dark:text-orange-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Seeker</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Looking for jobs</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: "employer"})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.role === "employer"
                          ? "border-[#FF8C00] dark:border-orange-400 bg-orange-50 dark:bg-orange-950/20"
                          : "border-gray-200 dark:border-slate-700 hover:border-[#FF8C00] dark:hover:border-orange-400"
                      }`}
                    >
                      <FaUserTie className="text-xl mx-auto mb-1 text-[#FF8C00] dark:text-orange-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Employer</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hiring talent</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-[#FF8C00] dark:text-orange-400 border-gray-300 dark:border-slate-600 rounded focus:ring-[#FF8C00] dark:focus:ring-orange-400"
                  />
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    I agree to the{" "}
                    <Link to="/terms" className="text-[#FF8C00] dark:text-orange-400 hover:underline font-medium">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-[#FF8C00] dark:text-orange-400 hover:underline font-medium">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Profile Details */}
            {step === 2 && (
              <div className="space-y-4">
                {formData.role === "employer" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Name *
                      </label>
                      <div className="relative">
                        <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400"
                          placeholder="Your company name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Phone *
                      </label>
                      <div className="relative">
                        <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                          type="tel"
                          name="companyPhone"
                          value={formData.companyPhone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400"
                          placeholder="+255 123 456 789"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Website
                      </label>
                      <input
                        type="url"
                        name="companyWebsite"
                        value={formData.companyWebsite}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400"
                        placeholder="https://yourcompany.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Address
                      </label>
                      <div className="relative">
                        <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                        <textarea
                          name="companyAddress"
                          value={formData.companyAddress}
                          onChange={handleChange}
                          rows="2"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400"
                          placeholder="Dar es Salaam, Tanzania"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Description
                      </label>
                      <textarea
                        name="companyDescription"
                        value={formData.companyDescription}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400"
                        placeholder="Tell us about your company..."
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FaUser className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      You're registering as a Job Seeker. You can complete your profile later.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
              )}
              
              {step === 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><FaSpinner className="animate-spin" /> Creating account...</> : "Create Account"}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;