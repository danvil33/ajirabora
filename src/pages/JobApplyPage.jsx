import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { getJobById } from "../services/jobService";
import { submitApplication, hasUserApplied } from "../services/applicationService";
import { getUserProfile, isProfileComplete } from "../services/userService";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { 
  BiBriefcase, 
  BiMoney, 
  BiMapPin, 
  BiBuilding,
  BiTimeFive,
  BiFile,
  BiEnvelope,
  BiUser,
  BiCheckCircle,
  BiErrorCircle,
  BiLoader,
  BiCalendar,
  BiBook,
  BiPhone,
  BiArrowBack,
  BiDownload,
  BiLinkExternal,
  BiUserCircle,
  BiBookOpen,
  BiBriefcaseAlt
} from "react-icons/bi";
import { FaWhatsapp, FaFilePdf, FaFileWord, FaFileAlt, FaExternalLinkAlt, FaLinkedin, FaGlobe } from "react-icons/fa";
import { SiIndeed, SiLinkedin } from "react-icons/si";

const JobApplyPage = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, [jobId, user]);

  const fetchData = async () => {
    try {
      const jobData = await getJobById(jobId);
      if (!jobData) {
        navigate("/jobs");
        return;
      }
      setJob(jobData);
      
      // Check if job is external - redirect immediately
      if (jobData.jobSource === "external" && jobData.externalUrl) {
        setRedirecting(true);
        // Redirect to external URL after 3 seconds
        setTimeout(() => {
          window.open(jobData.externalUrl, '_blank', 'noopener,noreferrer');
          navigate("/jobs");
        }, 3000);
        return;
      }
      
      if (user) {
        const applied = await hasUserApplied(user.uid, jobId);
        setAlreadyApplied(applied);
        
        const profile = await getUserProfile(user.uid);
        setProfileData(profile);
        const complete = isProfileComplete(profile);
        setProfileComplete(complete);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    
    if (!coverLetter.trim()) {
      setError("Please write a cover letter");
      return;
    }

    setApplying(true);
    setError("");

    try {
      const applicationData = {
        jobId: job.id,
        jobTitle: job.title,
        jobCompany: job.company,
        jobLocation: job.location,
        userId: user.uid,
        applicantName: profileData?.name || user.displayName,
        applicantEmail: user.email,
        applicantPhone: profileData?.phone || "",
        applicantLocation: profileData?.location || "",
        applicantEducation: profileData?.education || "",
        applicantExperience: profileData?.experience || "",
        coverLetter: coverLetter,
        resumeUrl: profileData?.resumeUrl || "",
        appliedAt: new Date().toISOString()
      };

      await submitApplication(applicationData);
      setSuccess("Application submitted successfully!");
      setAlreadyApplied(true);
      setCoverLetter("");
      
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  const shareOnWhatsApp = () => {
    const applyUrl = job?.jobSource === "external" && job?.externalUrl 
      ? job.externalUrl 
      : `${window.location.origin}/job/${job?.id}/apply`;
    
    const message = `🚨 *JOB ALERT: ${job?.title} at ${job?.company}*\n\n` +
                    `📍 *Location:* ${job?.location || 'Remote'}\n` +
                    `${job?.salary ? `💰 *Salary:* ${job?.salary}\n` : ''}\n` +
                    `🔗 *Apply here:* ${applyUrl}\n\n` +
                    `Share with someone looking for work! 🔁`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getSourceIcon = (source) => {
    switch(source) {
      case 'linkedin':
        return <SiLinkedin className="text-[#0077B5] text-lg" />;
      case 'indeed':
        return <SiIndeed className="text-[#2164F4] text-lg" />;
      case 'brightermonday':
        return <FaGlobe className="text-green-600 text-lg" />;
      default:
        return <FaExternalLinkAlt className="text-purple-500 text-lg" />;
    }
  };

  const getFileIcon = (url) => {
    if (!url) return <FaFileAlt className="text-gray-400 dark:text-gray-500" />;
    if (url.includes('.pdf')) return <FaFilePdf className="text-red-500 dark:text-red-400" />;
    if (url.includes('.doc') || url.includes('.docx')) return <FaFileWord className="text-blue-500 dark:text-blue-400" />;
    return <FaFileAlt className="text-gray-400 dark:text-gray-500" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Show redirecting screen for external jobs
  if (redirecting) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 pt-20">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExternalLinkAlt className="text-3xl text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Redirecting to External Site
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This job is hosted on <strong>{job?.sourcePlatform || "another platform"}</strong>. You'll be redirected to apply.
            </p>
            <div className="animate-pulse">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              Redirecting you to {job?.externalUrl ? new URL(job.externalUrl).hostname : "external site"}...
            </p>
            <button
              onClick={() => {
                window.open(job?.externalUrl, '_blank', 'noopener,noreferrer');
                navigate("/jobs");
              }}
              className="mt-6 text-[#FF8C00] dark:text-orange-400 hover:underline"
            >
              Click here if not redirected automatically
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C00] dark:border-orange-400"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!job) {
    return (
      <>
        <Header />
        <div className="text-center py-20 bg-gray-50 dark:bg-slate-900">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job not found</h2>
          <Link to="/jobs" className="text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 underline mt-4 inline-block">Back to Jobs</Link>
        </div>
        <Footer />
      </>
    );
  }

  const isExternal = job.jobSource === "external";

  return (
    <>
      <Header />
      <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF8C00] dark:hover:text-orange-400 mb-6 transition-colors"
          >
            <BiArrowBack /> Back to Jobs
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Header */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    {job.logo ? (
                      <img src={job.logo} alt={job.company} className="w-16 h-16 object-contain" />
                    ) : (
                      <BiBuilding className="text-[#FF8C00] dark:text-orange-400 text-3xl" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
                      {isExternal && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                          <FaExternalLinkAlt className="text-xs" />
                          External
                        </span>
                      )}
                    </div>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">{job.company}</p>
                    <div className="flex flex-wrap gap-2">
                      {job.type && (
                        <span className="inline-flex items-center gap-1 text-sm px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                          <BiBriefcase /> {job.type}
                        </span>
                      )}
                      {job.level && (
                        <span className="inline-flex items-center gap-1 text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                          <BiUser /> {job.level}
                        </span>
                      )}
                      {isExternal && job.sourcePlatform && (
                        <span className="inline-flex items-center gap-1 text-sm px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-full">
                          {getSourceIcon(job.sourcePlatform)}
                          Apply via {job.sourcePlatform.charAt(0).toUpperCase() + job.sourcePlatform.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BiFile className="text-[#FF8C00] dark:text-orange-400" />
                  Job Description
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {job.description || "No description provided"}
                </p>
              </div>

              {/* Requirements - Only for internal jobs */}
              {!isExternal && job.requirements && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BiBook className="text-[#FF8C00] dark:text-orange-400" />
                    Requirements & Qualifications
                  </h2>
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {job.requirements.split('\n').map((line, idx) => (
                      <p key={idx} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Info */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Job Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <BiMapPin className="text-[#FF8C00] dark:text-orange-400 text-lg" />
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{job.location || "Remote"}</p>
                    </div>
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <BiMoney className="text-[#FF8C00] dark:text-orange-400 text-lg" />
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Salary</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{job.salary}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <BiCalendar className="text-[#FF8C00] dark:text-orange-400 text-lg" />
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Posted Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(job.postedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <BiTimeFive className="text-[#FF8C00] dark:text-orange-400 text-lg" />
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Job Type</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{job.type || "Full-time"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Application Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Share Button */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
                  <button
                    onClick={shareOnWhatsApp}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                  >
                    <FaWhatsapp className="text-green-600 dark:text-green-400" /> Share this Job
                  </button>
                </div>

                {/* Application Section - Different for External Jobs */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                  {isExternal ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaExternalLinkAlt className="text-2xl text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">External Application</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        This job is hosted on <strong>{job.sourcePlatform || "another platform"}</strong>. 
                        You'll need to apply on their website.
                      </p>
                      <a
                        href={job.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <FaExternalLinkAlt />
                        Apply on {job.sourcePlatform ? job.sourcePlatform.charAt(0).toUpperCase() + job.sourcePlatform.slice(1) : "External Site"}
                      </a>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                        You'll be redirected to {job.externalUrl ? new URL(job.externalUrl).hostname : "the external site"} to complete your application.
                      </p>
                    </div>
                  ) : alreadyApplied ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BiCheckCircle className="text-3xl text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Application Submitted!</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">You have already applied for this position.</p>
                      <Link to="/applications" className="mt-4 inline-block text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300">
                        View My Applications →
                      </Link>
                    </div>
                  ) : !user ? (
                    <div className="text-center py-6">
                      <BiUser className="text-5xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Login to Apply</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Please login to submit your application</p>
                      <Link to="/login" className="block w-full bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] text-center transition">
                        Login Now
                      </Link>
                    </div>
                  ) : !profileComplete ? (
                    <div className="text-center py-6">
                      <BiErrorCircle className="text-5xl text-amber-500 dark:text-amber-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Complete Your Profile</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Please complete your profile before applying</p>
                      <Link to="/profile" className="block w-full bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] text-center transition">
                        Complete Profile
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitApplication}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Submit Application</h3>
                      
                      {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
                          {error}
                        </div>
                      )}
                      
                      {success && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg text-sm">
                          {success}
                        </div>
                      )}

                      {/* Applicant Information Section */}
                      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <BiUserCircle className="text-[#FF8C00] dark:text-orange-400" />
                          Your Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <BiUser className="text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">Name:</span>
                            <span className="text-gray-900 dark:text-white font-medium">{profileData?.name || user.displayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BiEnvelope className="text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">Email:</span>
                            <span className="text-gray-900 dark:text-white">{user.email}</span>
                          </div>
                          {profileData?.phone && (
                            <div className="flex items-center gap-2">
                              <BiPhone className="text-gray-400 dark:text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                              <span className="text-gray-900 dark:text-white">{profileData.phone}</span>
                            </div>
                          )}
                          {profileData?.location && (
                            <div className="flex items-center gap-2">
                              <BiMapPin className="text-gray-400 dark:text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">Location:</span>
                              <span className="text-gray-900 dark:text-white">{profileData.location}</span>
                            </div>
                          )}
                          {profileData?.education && (
                            <div className="flex items-start gap-2">
                              <BiBookOpen className="text-gray-400 dark:text-gray-500 mt-0.5" />
                              <span className="text-gray-600 dark:text-gray-400">Education:</span>
                              <span className="text-gray-900 dark:text-white flex-1">{profileData.education}</span>
                            </div>
                          )}
                          {profileData?.experience && (
                            <div className="flex items-start gap-2">
                              <BiBriefcaseAlt className="text-gray-400 dark:text-gray-500 mt-0.5" />
                              <span className="text-gray-600 dark:text-gray-400">Experience:</span>
                              <span className="text-gray-900 dark:text-white flex-1">{profileData.experience}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Resume/CV Section */}
                      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <BiFile className="text-[#FF8C00] dark:text-orange-400" />
                          Your Resume / CV
                        </h4>
                        {profileData?.resumeUrl ? (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <a
                              href={profileData.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors"
                            >
                              {getFileIcon(profileData.resumeUrl)}
                              <span>View Resume</span>
                              <BiLinkExternal className="text-sm" />
                            </a>
                            <a
                              href={profileData.resumeUrl}
                              download
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#1A2A4A] dark:border-slate-600 text-[#1A2A4A] dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              <BiDownload />
                              <span>Download</span>
                            </a>
                          </div>
                        ) : (
                          <div className="text-center py-3">
                            <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                              No resume found in your profile.
                            </p>
                            <Link to="/profile" className="text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 text-sm">
                              Add Resume to Profile →
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Cover Letter */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cover Letter <span className="text-red-500 dark:text-red-400">*</span>
                        </label>
                        <textarea
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={8}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400 focus:border-transparent transition"
                          placeholder="Write your cover letter here... Explain why you're the perfect fit for this position."
                          required
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Tell us about your skills, experience, and why you're interested in this role.
                        </p>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={applying}
                        className="w-full bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white py-3 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors disabled:opacity-50 font-medium"
                      >
                        {applying ? (
                          <span className="flex items-center justify-center gap-2">
                            <BiLoader className="animate-spin" />
                            Submitting Application...
                          </span>
                        ) : (
                          'Submit Application'
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default JobApplyPage;