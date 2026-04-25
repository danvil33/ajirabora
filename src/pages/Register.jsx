import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import logo from "../Assets/logo.png";
import poster from "../Assets/poster.png";
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
  FaSpinner,
  FaShieldAlt,
  FaMailBulk,
  FaCopy,
  FaCheck,
  FaArrowRight,
  FaSyncAlt,
  FaExternalLinkAlt
} from "react-icons/fa";

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "jobseeker",
    agreeTerms: false,
    companyName: "",
    companyWebsite: "",
    companyPhone: "",
    companyAddress: "",
    companyDescription: "",
    verificationMethod: "email"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDNSInstructions, setShowDNSInstructions] = useState(false);
  const [dnsToken, setDnsToken] = useState("");
  const [domainToVerify, setDomainToVerify] = useState("");
  const [copied, setCopied] = useState(false);
  const [verifyingDNS, setVerifyingDNS] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [userId, setUserId] = useState(null);
  
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
      if (!formData.companyWebsite.trim()) {
        setError("Company website is required for verification");
        return false;
      }
      
      // Extract domain from website
      const domain = formData.companyWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      
      // For all employers, email must match company domain (custom email)
      const emailDomain = formData.email.split('@')[1].toLowerCase();
      if (emailDomain !== domain) {
        setError(`Your email must match your company domain. Please use an email like admin@${domain}`);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyDNS = async () => {
    setVerifyingDNS(true);
    setVerificationStatus(null);
    
    try {
      const response = await fetch('/api/verify-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domainToVerify,
          token: dnsToken,
          userId: userId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVerificationStatus({ type: 'success', message: 'Domain verified successfully! Redirecting to login...' });
        
        // Update Firestore
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          isCompanyVerified: true,
          verificationStatus: "verified",
          verifiedAt: new Date().toISOString()
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setVerificationStatus({ 
          type: 'error', 
          message: data.error || 'Verification failed. Make sure you added the TXT record correctly.' 
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationStatus({ 
        type: 'error', 
        message: 'Failed to verify domain. Please try again.' 
      });
    } finally {
      setVerifyingDNS(false);
    }
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
      setUserId(user.uid);
      
      // 2. Update profile with name
      await updateProfile(user, { displayName: formData.name });
      
      // 3. Save user data to Firestore
      const cleanDomain = formData.companyWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      
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
        profileData.verificationMethod = formData.verificationMethod;
        profileData.isCompanyVerified = false;
        profileData.verificationStatus = "pending";
        profileData.companyDomain = cleanDomain;
        
        if (formData.verificationMethod === "dns") {
          const token = `ajirabora-verify=${user.uid}_${Date.now()}`;
          profileData.dnsVerificationToken = token;
          setDnsToken(token);
          setDomainToVerify(cleanDomain);
        }
      }
      
      await setDoc(doc(db, "users", user.uid), profileData);
      
      // 4. Sign out immediately (prevent auto-login)
      await signOut(auth);
      setUser(null);
      
      // 5. Show appropriate verification screen
      if (formData.role === "employer" && formData.verificationMethod === "dns") {
        setShowDNSInstructions(true);
      } else {
        // For job seekers or email verification
        await sendEmailVerification(user);
        setVerificationEmail(formData.email);
        setVerificationSent(true);
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

  // State for verification sent screen
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  // DNS Instructions Screen
  if (showDNSInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Progress Header */}
          <div className="bg-gradient-to-r from-[#1A2A4A] to-[#2a3d6e] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h2 className="text-lg font-semibold">Step 3 of 3</h2>
                <p className="text-sm opacity-90">Verify Your Company Domain</p>
              </div>
              <div className="w-10 h-10 bg-[#FF8C00] rounded-full flex items-center justify-center">
                <FaShieldAlt className="text-white" />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#FF8C00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-3xl text-[#FF8C00]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Verify Your Domain Ownership
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                To prove you own <strong className="text-[#FF8C00]">{domainToVerify}</strong>, add this TXT record to your DNS settings
              </p>
            </div>

            {/* DNS Instructions Card */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5 mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <FaExternalLinkAlt className="text-[#FF8C00] text-xs" />
                Add this TXT record at your domain provider (Namecheap, GoDaddy, Cloudflare, etc.):
              </p>
              
              <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-[#FF8C00] font-bold">TXT</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-gray-400">Name/Host:</span>
                  <span className="text-white">@</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-gray-400">Value:</span>
                  <span className="text-green-400 break-all">{dnsToken}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-gray-400">TTL:</span>
                  <span className="text-white">Automatic or 3600</span>
                </div>
              </div>
              
              <button
                onClick={() => copyToClipboard(dnsToken)}
                className="mt-3 flex items-center gap-2 text-sm text-[#FF8C00] hover:text-orange-600 transition"
              >
                {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                {copied ? "Copied!" : "Copy TXT Value"}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>⏱️ Important:</strong> After adding the DNS record, DNS propagation can take 1-30 minutes. 
                Make sure to save the record before verifying.
              </p>
            </div>

            {/* Verification Status */}
            {verificationStatus && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                verificationStatus.type === 'success' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {verificationStatus.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={verifyDNS}
                disabled={verifyingDNS}
                className="flex-1 bg-gradient-to-r from-[#FF8C00] to-orange-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                {verifyingDNS ? (
                  <><FaSpinner className="animate-spin" /> Verifying...</>
                ) : (
                  <><FaSyncAlt /> Verify DNS Record</>
                )}
              </button>
              
              <Link
                to="/login"
                className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold text-center hover:bg-gray-300 dark:hover:bg-slate-600 transition"
              >
                Complete Later
              </Link>
            </div>
            
            <p className="text-center text-xs text-gray-500 mt-4">
              You can also complete verification later from your company profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Email Verification Screen
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
            className="inline-block bg-gradient-to-r from-[#FF8C00] to-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full">
        <div className="flex flex-col md:flex-row rounded-2xl shadow-xl overflow-hidden">
          
          {/* Left Side - Image Section */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#1A2A4A] to-[#2a3d6e] relative overflow-hidden">
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#FF8C00] rounded-full opacity-10 blur-2xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#FF8C00] rounded-full opacity-10 blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col justify-center items-center p-8 w-full h-full">
              <img 
                src={poster} 
                alt="AjiraBora - Find your dream job" 
                className="w-full h-auto object-contain rounded-2xl max-h-[500px]"
              />
              
              <div className="mt-6 text-center">
                <h3 className="text-white text-xl font-bold mb-2">Find Your Dream Job Today!</h3>
                <p className="text-gray-300 text-sm">Connect with top employers across Tanzania</p>
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
            <div className="text-center mb-6">
              <img src={logo} alt="AjiraBora" className="h-16 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Join AjiraBora to start your career journey</p>
            </div>

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
                <span className="text-xs mt-1 block">Company Details</span>
              </div>
              <div className={`flex-1 text-center ${step >= 3 ? 'text-[#FF8C00] dark:text-orange-400' : 'text-gray-400 dark:text-gray-600'}`}>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${step >= 3 ? 'bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                  3
                </div>
                <span className="text-xs mt-1 block">Verification</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
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
                        required
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
                        required
                      />
                    </div>
                    {formData.role === "employer" && formData.companyWebsite && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Must match: @{formData.companyWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </p>
                    )}
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
                            ? "border-[#FF8C00] bg-orange-50 dark:bg-orange-950/20"
                            : "border-gray-200 dark:border-slate-700 hover:border-[#FF8C00]"
                        }`}
                      >
                        <FaUser className="text-xl mx-auto mb-1 text-[#FF8C00]" />
                        <span className="text-sm font-medium">Job Seeker</span>
                        <p className="text-xs text-gray-500 mt-1">Looking for jobs</p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, role: "employer"})}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.role === "employer"
                            ? "border-[#FF8C00] bg-orange-50 dark:bg-orange-950/20"
                            : "border-gray-200 dark:border-slate-700 hover:border-[#FF8C00]"
                        }`}
                      >
                        <FaUserTie className="text-xl mx-auto mb-1 text-[#FF8C00]" />
                        <span className="text-sm font-medium">Employer</span>
                        <p className="text-xs text-gray-500 mt-1">Hiring talent</p>
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
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600"
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
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-[#FF8C00] border-gray-300 rounded focus:ring-[#FF8C00]"
                    />
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      I agree to the{" "}
                      <Link to="/terms" className="text-[#FF8C00] hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-[#FF8C00] hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Company Details */}
              {step === 2 && formData.role === "employer" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Name *
                    </label>
                    <div className="relative">
                      <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700"
                        placeholder="Your company name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Phone *
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="companyPhone"
                        value={formData.companyPhone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700"
                        placeholder="+255 123 456 789"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Website *
                    </label>
                    <input
                      type="url"
                      name="companyWebsite"
                      value={formData.companyWebsite}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700"
                      placeholder="https://yourcompany.com"
                      required
                    />
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Your email must match this domain
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Address
                    </label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        name="companyAddress"
                        value={formData.companyAddress}
                        onChange={handleChange}
                        rows="2"
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700"
                      placeholder="Tell us about your company..."
                    />
                  </div>

                  {/* Verification Method Selection */}
                  <div className="border-t border-gray-200 dark:border-slate-600 pt-4 mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      <FaShieldAlt className="inline mr-2 text-[#FF8C00]" />
                      Verification Method *
                    </label>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <label className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.verificationMethod === "email"
                          ? "border-[#FF8C00] bg-orange-50 dark:bg-orange-950/20"
                          : "border-gray-200 dark:border-slate-700 hover:border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="verificationMethod"
                          value="email"
                          checked={formData.verificationMethod === "email"}
                          onChange={handleChange}
                          className="mt-1 mr-3 text-[#FF8C00] focus:ring-[#FF8C00]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FaMailBulk className="text-[#FF8C00]" />
                            <span className="font-medium">Email Verification (Recommended)</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            We'll send a verification link to your company email. Takes 1 minute.
                          </p>
                        </div>
                      </label>

                      <label className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.verificationMethod === "dns"
                          ? "border-[#FF8C00] bg-orange-50 dark:bg-orange-950/20"
                          : "border-gray-200 dark:border-slate-700 hover:border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="verificationMethod"
                          value="dns"
                          checked={formData.verificationMethod === "dns"}
                          onChange={handleChange}
                          className="mt-1 mr-3 text-[#FF8C00] focus:ring-[#FF8C00]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FaShieldAlt className="text-[#FF8C00]" />
                            <span className="font-medium">DNS Verification (Advanced)</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Add a TXT record to your DNS. Get a "Verified" badge on your profile.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Seeker Step 2 */}
              {step === 2 && formData.role !== "employer" && (
                <div className="text-center py-8">
                  <FaUser className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    You're registering as a Job Seeker. You can complete your profile later.
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                )}
                
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-[#1A2A4A] text-white py-2 rounded-lg hover:bg-[#243b66] transition flex items-center justify-center gap-2"
                  >
                    Next <FaArrowRight className="text-xs" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-[#FF8C00] to-orange-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <><FaSpinner className="animate-spin" /> Creating Account...</> : "Create Account"}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-[#FF8C00] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;