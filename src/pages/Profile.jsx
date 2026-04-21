import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/authService";
import { getUserProfile, saveUserProfile, updateUserProfile } from "../services/userService";
import { getApplicationsByUser } from "../services/applicationService";
import { getEmployerJobs } from "../services/jobService";
import { getApplicationsByJob } from "../services/applicationService";
import { uploadProfilePicture, uploadResume } from "../services/cloudinaryService";
import { useNavigate, Link } from "react-router-dom";
import Header from "../Components/Header/Header";
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarker, 
  FaBriefcase, 
  FaSignOutAlt,
  FaEdit,
  FaCheckCircle,
  FaCalendarAlt,
  FaSpinner,
  FaBuilding,
  FaGraduationCap,
  FaCamera,
  FaTrash,
  FaFilePdf,
  FaChartLine,
  FaCheckDouble,
  FaUsers,
  FaFileAlt,
  FaMoneyBillWave,
  FaStar,
  FaRocket
} from "react-icons/fa";

const Profile = () => {
  const { user, isEmployer, isJobSeeker } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  
  // Job Seeker specific
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [aiReadiness, setAiReadiness] = useState(0);
  
  // Employer specific
  const [jobsPostedCount, setJobsPostedCount] = useState(0);
  const [applicationsReceivedCount, setApplicationsReceivedCount] = useState(0);
  const [hiresMadeCount, setHiresMadeCount] = useState(0);
  
  // Job Seeker Profile Data (UPDATED with AI matching fields)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    title: "",          // Desired Job Title
    education: "",
    skills: "",
    bio: "",
    resumeUrl: "",
    experienceLevel: "",  // NEW: Beginner/Intermediate/Experienced/Professional
    salaryExpectation: "" // NEW: Expected salary in TZS
  });

  // Employer Profile Data
  const [employerData, setEmployerData] = useState({
    companyName: "",
    companyPhone: "",
    companyAddress: "",
    companyDescription: "",
    industry: "",
    employeeCount: ""
  });

  // Optimized: Fetch ALL data in parallel
  const fetchAllData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    try {
      const profile = await getUserProfile(user.uid);
      
      if (profile && profile.profilePicture) {
        setProfilePictureUrl(profile.profilePicture);
      }
      
      if (isJobSeeker()) {
        setProfileData({
          name: profile?.name || user.displayName || "",
          email: profile?.email || user.email || "",
          phone: profile?.phone || "",
          location: profile?.location || "",
          title: profile?.title || "",
          education: profile?.education || "",
          skills: profile?.skills || "",
          bio: profile?.bio || "",
          resumeUrl: profile?.resumeUrl || "",
          experienceLevel: profile?.experienceLevel || "",
          salaryExpectation: profile?.salaryExpectation || ""
        });
        
        const apps = await getApplicationsByUser(user.uid);
        setApplicationsCount(apps.length);
        
        // Calculate profile completion (UPDATED for AI matching)
        const aiFields = [
          profile?.name, profile?.phone, profile?.location, profile?.title,
          profile?.education, profile?.skills, profile?.bio,
          profile?.experienceLevel, profile?.salaryExpectation
        ];
        const filled = aiFields.filter(f => f && f.trim() !== "").length;
        setProfileCompletion(Math.round((filled / 9) * 100));
        
        // Calculate AI Readiness Score (fields needed for matching)
        const aiRequired = [profile?.skills, profile?.title, profile?.location, profile?.experienceLevel];
        const aiFilled = aiRequired.filter(f => f && f.trim() !== "").length;
        setAiReadiness(Math.round((aiFilled / 4) * 100));
        
      } else if (isEmployer()) {
        setEmployerData({
          companyName: profile?.companyName || "",
          companyPhone: profile?.companyPhone || "",
          companyAddress: profile?.companyAddress || "",
          companyDescription: profile?.companyDescription || "",
          industry: profile?.industry || "",
          employeeCount: profile?.employeeCount || ""
        });
        
        const employerJobs = await getEmployerJobs(user.uid);
        setJobsPostedCount(employerJobs.length);
        
        const jobPromises = employerJobs.map(job => getApplicationsByJob(job.id));
        const allApplications = await Promise.all(jobPromises);
        
        let totalApps = 0;
        let totalHires = 0;
        allApplications.forEach(apps => {
          totalApps += apps.length;
          totalHires += apps.filter(app => app.status === 'hired').length;
        });
        
        setApplicationsReceivedCount(totalApps);
        setHiresMadeCount(totalHires);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [user, isJobSeeker, isEmployer]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleChange = (e) => {
    if (isEmployer() && (e.target.name === 'companyName' || e.target.name === 'companyPhone' || e.target.name === 'companyAddress' || e.target.name === 'companyDescription' || e.target.name === 'industry' || e.target.name === 'employeeCount')) {
      setEmployerData({
        ...employerData,
        [e.target.name]: e.target.value
      });
    } else {
      setProfileData({
        ...profileData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const imageUrl = await uploadProfilePicture(file);
      await updateUserProfile(user.uid, { profilePicture: imageUrl });
      setProfilePictureUrl(imageUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload PDF or Word document');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingResume(true);
    setError("");

    try {
      const resumeUrl = await uploadResume(file);
      await updateUserProfile(user.uid, { resumeUrl });
      setProfileData(prev => ({ ...prev, resumeUrl }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error uploading resume:', error);
      setError(error.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm("Remove profile picture?")) return;
    
    setUploadingImage(true);
    try {
      await updateUserProfile(user.uid, { profilePicture: "" });
      setProfilePictureUrl("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setError("Failed to remove image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    
    try {
      const saveData = isEmployer() 
        ? { ...employerData, email: user.email }
        : { ...profileData, email: user.email };
      
      await saveUserProfile(user.uid, saveData);
      setSaved(true);
      setIsEditing(false);
      
      await fetchAllData();
      
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const jobSeekerStats = [
    { label: "Applications Sent", value: applicationsCount, icon: <FaFileAlt className="text-[#FF8C00] dark:text-orange-400" /> },
    { label: "Skills", value: profileData.skills ? profileData.skills.split(',').length : 0, icon: <FaCheckDouble className="text-[#FF8C00] dark:text-orange-400" /> },
    { label: "AI Match Ready", value: `${aiReadiness}%`, icon: <FaRocket className="text-[#FF8C00] dark:text-orange-400" /> },
  ];

  const employerStats = [
    { label: "Jobs Posted", value: jobsPostedCount, icon: <FaBriefcase className="text-[#FF8C00] dark:text-orange-400" /> },
    { label: "Applications", value: applicationsReceivedCount, icon: <FaUsers className="text-[#FF8C00] dark:text-orange-400" /> },
    { label: "Hires", value: hiresMadeCount, icon: <FaCheckCircle className="text-[#FF8C00] dark:text-orange-400" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header />
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-[#FF8C00] dark:text-orange-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // JOB SEEKER PROFILE VIEW
  if (isJobSeeker()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Header />
        
        <div className="pt-24 pb-12 px-4 max-w-6xl mx-auto">
          {saved && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <FaCheckCircle /> Profile updated successfully!
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* AI Readiness Warning */}
          {aiReadiness < 100 && (
            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaStar className="text-yellow-500 text-xl mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    Complete your profile for better AI job matches!
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                    Add your {!profileData.skills && "Skills, "}{!profileData.title && "Desired Job Title, "}{!profileData.location && "Location, "}{!profileData.experienceLevel && "Experience Level"} to get personalized job recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 text-center sticky top-24">
                <div className="relative inline-block mb-4">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-[#1A2A4A] to-[#243b66] dark:from-[#0f1a2e] dark:to-[#1a2a4a] mx-auto shadow-md">
                    {profilePictureUrl ? <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FaUser className="text-white text-3xl" /></div>}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="absolute bottom-0 right-0 bg-[#FF8C00] dark:bg-orange-500 text-white p-1.5 rounded-full shadow-md hover:bg-orange-600 dark:hover:bg-orange-600">
                    {uploadingImage ? <FaSpinner className="animate-spin text-xs" /> : <FaCamera className="text-xs" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  {profilePictureUrl && <button onClick={handleRemoveImage} className="absolute bottom-0 left-0 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600"><FaTrash className="text-xs" /></button>}
                </div>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{profileData.name || "User"}</h2>
                {profileData.title && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{profileData.title}</p>}
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1"><FaCalendarAlt /> Member since {new Date(user?.metadata?.creationTime).getFullYear()}</p>
                </div>

                {profileData.resumeUrl && (
                  <a href={profileData.resumeUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 text-sm text-[#FF8C00] dark:text-orange-400 border border-[#FF8C00] dark:border-orange-400 rounded-lg py-2 hover:bg-orange-50 dark:hover:bg-orange-950/20">
                    <FaFilePdf /> View Resume
                  </a>
                )}
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {jobSeekerStats.map((stat, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 text-center">
                    <div className="text-2xl mb-2 flex justify-center">{stat.icon}</div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Completion</span>
                  <span className="text-sm font-semibold text-[#FF8C00] dark:text-orange-400">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                  <div className="bg-[#FF8C00] dark:bg-orange-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%` }}></div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                  {!isEditing && <button onClick={() => setIsEditing(true)} className="text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 text-sm flex items-center gap-1"><FaEdit /> Edit Profile</button>}
                </div>
                
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Full Name</label>{isEditing ? <input type="text" name="name" value={profileData.name} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1">{profileData.name || "Not set"}</p>}</div>
                      <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1"><FaPhone className="dark:text-gray-500" /> Phone</label>{isEditing ? <input type="tel" name="phone" value={profileData.phone} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1">{profileData.phone || "Not set"}</p>}</div>
                      <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1"><FaMapMarker className="dark:text-gray-500" /> Location</label>{isEditing ? <input type="text" name="location" value={profileData.location} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1">{profileData.location || "Not set"}</p>}</div>
                      <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1"><FaBriefcase className="dark:text-gray-500" /> Desired Job Title</label>{isEditing ? <input type="text" name="title" value={profileData.title} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1">{profileData.title || "Not set"}</p>}</div>
                      
                      {/* NEW: Experience Level Field */}
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1">
                          <FaStar className="dark:text-gray-500" /> Experience Level
                        </label>
                        {isEditing ? (
                          <select name="experienceLevel" value={profileData.experienceLevel} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400">
                            <option value="">Select experience level</option>
                            <option value="Beginner">Beginner (0-1 years)</option>
                            <option value="Intermediate">Intermediate (2-4 years)</option>
                            <option value="Experienced">Experienced (5-7 years)</option>
                            <option value="Professional">Professional (8+ years)</option>
                          </select>
                        ) : (
                          <p className="text-gray-900 dark:text-white mt-1">{profileData.experienceLevel || "Not set"}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Used for AI job matching</p>
                      </div>
                      
                      {/* NEW: Salary Expectation Field */}
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1">
                          <FaMoneyBillWave className="dark:text-gray-500" /> Salary Expectation (TZS)
                        </label>
                        {isEditing ? (
                          <input type="number" name="salaryExpectation" value={profileData.salaryExpectation} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" placeholder="e.g., 1500000" />
                        ) : (
                          <p className="text-gray-900 dark:text-white mt-1">{profileData.salaryExpectation ? `TZS ${parseInt(profileData.salaryExpectation).toLocaleString()}` : "Not set"}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Used for AI job matching</p>
                      </div>
                      
                      <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1"><FaEnvelope className="dark:text-gray-500" /> Email</label><p className="text-gray-900 dark:text-white mt-1">{profileData.email}</p></div>
                    </div>
                    
                    <div className="space-y-4">
                      <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1"><FaGraduationCap className="dark:text-gray-500" /> Education</label>{isEditing ? <textarea name="education" value={profileData.education} onChange={handleChange} rows="2" className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{profileData.education || "Not set"}</p>}</div>
                      <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Skills (comma separated)</label>{isEditing ? <input type="text" name="skills" value={profileData.skills} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <div className="flex flex-wrap gap-2 mt-2">{profileData.skills ? profileData.skills.split(',').map((skill, i) => <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full">{skill.trim()}</span>) : <p className="text-gray-500 dark:text-gray-400 text-sm">No skills added</p>}</div>}</div>
                      <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Professional Summary</label>{isEditing ? <textarea name="bio" value={profileData.bio} onChange={handleChange} rows="3" className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{profileData.bio || "No bio added"}</p>}</div>
                    </div>
                  </div>
                  
                  <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1"><FaFilePdf className="dark:text-gray-500" /> Resume / CV</label>
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <button onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume} className="px-4 py-2 border border-[#FF8C00] dark:border-orange-400 text-[#FF8C00] dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 text-sm flex items-center gap-2">{uploadingResume ? <FaSpinner className="animate-spin" /> : <FaFilePdf />} {profileData.resumeUrl ? "Update Resume" : "Upload Resume"}</button>
                      <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                      {profileData.resumeUrl && <a href={profileData.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#FF8C00] dark:text-orange-400 hover:underline">Download Resume</a>}
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex gap-3 pt-4">
                      <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
                      <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] flex items-center justify-center gap-2">{saving ? <><FaSpinner className="animate-spin" /> Saving...</> : 'Save Changes'}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button onClick={handleLogout} className="px-6 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors text-sm flex items-center gap-2 mx-auto"><FaSignOutAlt /> Logout</button>
          </div>
        </div>
      </div>
    );
  }

  // EMPLOYER PROFILE VIEW (unchanged, remains the same)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        {saved && <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2"><FaCheckCircle /> Profile updated successfully!</div>}
        {error && <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 text-center sticky top-24">
              <div className="relative inline-block mb-4">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-[#1A2A4A] to-[#243b66] dark:from-[#0f1a2e] dark:to-[#1a2a4a] mx-auto shadow-md">
                  {profilePictureUrl ? <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FaBuilding className="text-white text-3xl" /></div>}
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="absolute bottom-0 right-0 bg-[#FF8C00] dark:bg-orange-500 text-white p-1.5 rounded-full shadow-md hover:bg-orange-600 dark:hover:bg-orange-600">
                  {uploadingImage ? <FaSpinner className="animate-spin text-xs" /> : <FaCamera className="text-xs" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{employerData.companyName || "Company"}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Employer Account</p>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700"><p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1"><FaCalendarAlt /> Member since {new Date(user?.metadata?.creationTime).getFullYear()}</p></div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {employerStats.map((stat, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 text-center">
                  <div className="text-2xl mb-2 flex justify-center">{stat.icon}</div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Company Information</h2>
                {!isEditing && <button onClick={() => setIsEditing(true)} className="text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 text-sm flex items-center gap-1"><FaEdit /> Edit</button>}
              </div>
              
              <div className="p-6 space-y-5">
                <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Company Name</label>{isEditing ? <input type="text" name="companyName" value={employerData.companyName} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1">{employerData.companyName || "Not set"}</p>}</div>
                <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1"><FaPhone className="dark:text-gray-500" /> Company Phone</label>{isEditing ? <input type="tel" name="companyPhone" value={employerData.companyPhone} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1">{employerData.companyPhone || "Not set"}</p>}</div>
                <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1"><FaMapMarker className="dark:text-gray-500" /> Company Address</label>{isEditing ? <textarea name="companyAddress" value={employerData.companyAddress} onChange={handleChange} rows="2" className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{employerData.companyAddress || "Not set"}</p>}</div>
                <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Industry</label>{isEditing ? <input type="text" name="industry" value={employerData.industry} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1">{employerData.industry || "Not set"}</p>}</div>
                <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Employee Count</label>{isEditing ? <select name="employeeCount" value={employerData.employeeCount} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400"><option value="">Select size</option><option value="1-10">1-10 employees</option><option value="11-50">11-50 employees</option><option value="51-200">51-200 employees</option><option value="201-500">201-500 employees</option><option value="500+">500+ employees</option></select> : <p className="text-gray-900 dark:text-white mt-1">{employerData.employeeCount || "Not set"}</p>}</div>
                <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Company Description</label>{isEditing ? <textarea name="companyDescription" value={employerData.companyDescription} onChange={handleChange} rows="3" className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400" /> : <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{employerData.companyDescription || "Not set"}</p>}</div>
                <div><label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1"><FaEnvelope className="dark:text-gray-500" /> Contact Email</label><p className="text-gray-900 dark:text-white mt-1">{user?.email}</p></div>
                
                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] flex items-center justify-center gap-2">{saving ? <><FaSpinner className="animate-spin" /> Saving...</> : 'Save Changes'}</button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link to="/post-job" className="px-4 py-2 bg-[#FF8C00] dark:bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm">+ Post a New Job</Link>
                <Link to="/dashboard" className="px-4 py-2 border border-[#FF8C00] dark:border-orange-400 text-[#FF8C00] dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors text-sm">View Dashboard</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={handleLogout} className="px-6 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors text-sm flex items-center gap-2 mx-auto"><FaSignOutAlt /> Logout</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;