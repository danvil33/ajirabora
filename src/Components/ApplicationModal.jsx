import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { submitApplication, hasUserApplied } from "../services/applicationService";
import { getUserProfile, isProfileComplete } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { 
  BiX, 
  BiCheckCircle, 
  BiErrorCircle,
  BiLoader,
  BiUser,
  BiEnvelope,
  BiPhone,
  BiMapPin,
  BiBook,
  BiFile,
  BiDownload,
  BiLinkExternal
} from "react-icons/bi";
import { FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";

const ApplicationModal = ({ job, onClose, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      checkProfileAndApplication();
    }
  }, [user, job]);

  const checkProfileAndApplication = async () => {
    try {
      const applied = await hasUserApplied(user.uid, job.id);
      setAlreadyApplied(applied);
      
      if (applied) {
        setCheckingProfile(false);
        return;
      }
      
      const profile = await getUserProfile(user.uid);
      setProfileData(profile);
      
      const complete = isProfileComplete(profile);
      setProfileComplete(complete);
      
    } catch (error) {
      console.error("Error checking profile:", error);
    } finally {
      setCheckingProfile(false);
    }
  };

  const getFileIcon = (url) => {
    if (!url) return <FaFileAlt className="text-gray-400" />;
    if (url.includes('.pdf')) return <FaFilePdf className="text-red-500" />;
    if (url.includes('.doc') || url.includes('.docx')) return <FaFileWord className="text-blue-500" />;
    return <FaFileAlt className="text-gray-400" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!coverLetter.trim()) {
      setError("Please write a cover letter");
      return;
    }
    
    setLoading(true);
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
        // Use resume from profile if available
        resumeUrl: profileData?.resumeUrl || "",
        appliedAt: new Date().toISOString()
      };
      
      await submitApplication(applicationData);
      setSuccess("Application submitted successfully!");
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error("Error submitting application:", err);
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToProfile = () => {
    onClose();
    navigate("/profile");
  };

  if (checkingProfile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-8 text-center">
          <BiLoader className="animate-spin text-3xl text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking your profile...</p>
        </div>
      </div>
    );
  }

  if (alreadyApplied) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <BiCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Already Applied
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have already applied for this position.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <BiErrorCircle className="text-5xl text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Your Profile First
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Before applying for jobs, please complete your profile with:
            </p>
            <ul className="text-left text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
              <li>• Full Name</li>
              <li>• Phone Number</li>
              <li>• Location</li>
              <li>• Education</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={goToProfile}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
              >
                Complete Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Apply for {job.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <BiX size={24} />
          </button>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
          <p className="font-semibold text-gray-900 dark:text-white">{job.company}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{job.location}</p>
          <div className="flex gap-2 mt-2">
            {job.type && (
              <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                {job.type}
              </span>
            )}
            {job.level && (
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                {job.level}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <BiErrorCircle />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <BiCheckCircle />
              {success}
            </div>
          )}

          {/* Your Information Section */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your Information</h3>
            
            <div className="flex items-center gap-2 text-sm">
              <BiUser className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <span className="text-gray-900 dark:text-white">{profileData?.name || user.displayName}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <BiEnvelope className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span className="text-gray-900 dark:text-white">{user.email}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <BiPhone className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Phone:</span>
              <span className="text-gray-900 dark:text-white">{profileData?.phone || "Not provided"}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <BiMapPin className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Location:</span>
              <span className="text-gray-900 dark:text-white">{profileData?.location || "Not provided"}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <BiBook className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Education:</span>
              <span className="text-gray-900 dark:text-white">{profileData?.education || "Not provided"}</span>
            </div>
          </div>

          {/* Resume Section - Shows profile resume if available */}
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <BiFile className="text-indigo-500" />
              Your Resume / CV
            </h3>
            {profileData?.resumeUrl ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={profileData.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  {getFileIcon(profileData.resumeUrl)}
                  <span>View Resume</span>
                  <BiLinkExternal className="text-sm" />
                </a>
                <a
                  href={profileData.resumeUrl}
                  download
                  className="inline-flex items-center gap-2 px-3 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <BiDownload />
                  <span>Download</span>
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  This resume is from your profile. 
                  <button
                    type="button"
                    onClick={goToProfile}
                    className="text-indigo-600 hover:underline ml-1"
                  >
                    Update in Profile →
                  </button>
                </p>
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  No resume found in your profile.
                </p>
                <button
                  type="button"
                  onClick={goToProfile}
                  className="text-indigo-600 hover:underline text-sm"
                >
                  Add Resume to Profile →
                </button>
              </div>
            )}
          </div>

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Letter *
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
              placeholder="Write your cover letter explaining why you're the perfect fit for this position..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Tell us about your skills, experience, and why you're interested in this role.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:text-white dark:border-slate-600 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <BiLoader className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;