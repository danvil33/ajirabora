import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createJob } from "../services/jobService";
import { uploadCompanyLogo } from "../services/cloudinaryService";
import { getAllJobSeekers, notifyAllJobSeekers } from "../services/notificationService";
import Header from "../Components/Header/Header";
import { 
  FaBuilding, 
  FaUpload, 
  FaTrash, 
  FaSpinner,
  FaBriefcase,
  FaMapMarker,
  FaMoneyBill,
  FaEnvelope,
  FaBell,
  FaInfoCircle
} from "react-icons/fa";

const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Fulltime",
    level: "Intermediate",
    salary: "",
    description: "",
    requirements: "",
    contactEmail: "",
    logo: null
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      setFormData(prev => ({
        ...prev,
        contactEmail: user.email || ""
      }));
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      const uploadedUrl = await uploadCompanyLogo(file);
      setLogoUrl(uploadedUrl);
      setFormData(prev => ({ ...prev, logo: uploadedUrl }));
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError(error.message || 'Failed to upload logo. Please try again.');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoUrl("");
    setFormData(prev => ({ ...prev, logo: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setNotificationStatus("");
    setLoading(true);

    if (!formData.title || !formData.company || !formData.location || !formData.description || !formData.requirements) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      // Convert requirements text to skills array for AI matching
      const requiredSkillsArray = formData.requirements
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill !== "");
      
      const jobData = {
        ...formData,
        logo: logoUrl || null,
        postedBy: user.uid,
        postedByEmail: user.email,
        postedAt: new Date().toISOString(),
        status: "active",
        requiredSkills: requiredSkillsArray  // ← CRITICAL for AI matching
      };
      
      // Create the job
      const createdJob = await createJob(jobData);
      
      // Send notifications to all job seekers
      setNotificationStatus("Sending job alerts to job seekers...");
      
      const jobWithId = { id: createdJob.id, ...jobData };
      const jobSeekers = await getAllJobSeekers();
      
      if (jobSeekers.length > 0) {
        const result = await notifyAllJobSeekers(jobWithId);
        setNotificationStatus(`✅ Job alerts sent to ${result.sent} job seekers`);
      } else {
        setNotificationStatus("No job seekers found to notify");
      }
      
      setSuccess("Job posted successfully!");
      
      // Reset form
      setFormData({
        title: "",
        company: "",
        location: "",
        type: "Fulltime",
        level: "Intermediate",
        salary: "",
        description: "",
        requirements: "",
        contactEmail: user.email || "",
        logo: null
      });
      setLogoPreview(null);
      setLogoUrl("");
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
      
    } catch (err) {
      console.error("Error posting job:", err);
      setError(err.message || "Failed to post job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <Header />
      
      <div className="pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-700 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Post a New Job
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <FaBell className="text-[#FF8C00]" />
                  <span>Job seekers will be notified</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Fill in the details below to list your job opening
              </p>

              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              {notificationStatus && (
                <div className="mb-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded flex items-center gap-2">
                  <FaBell />
                  {notificationStatus}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo Upload Section */}
                <div className="border-b border-gray-200 dark:border-slate-600 pb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Logo <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img 
                          src={logoPreview} 
                          alt="Company logo preview" 
                          className="w-20 h-20 object-contain border rounded-lg p-2 bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 dark:bg-slate-600 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <FaBuilding className="text-gray-400 text-2xl" />
                      </div>
                    )}
                    
                    <div>
                      <label className="cursor-pointer bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
                        {uploadingLogo ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaUpload />
                        )}
                        {logoPreview ? "Change Logo" : "Upload Logo"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        JPG, PNG, GIF (max 2MB). Recommended: 100x100px
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                      placeholder="e.g., Dar es Salaam or Remote"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Type *
                    </label>
                    <select
                      name="type"
                      required
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                    >
                      <option value="Fulltime">Full Time</option>
                      <option value="Parttime">Part Time</option>
                      <option value="Remote">Remote</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Experience Level *
                    </label>
                    <select
                      name="level"
                      required
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Experienced">Experienced</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Salary Range (Optional)
                    </label>
                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                      placeholder="e.g., TZS 1,500,000 - 2,000,000"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Higher salary increases match score
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                    placeholder="Describe the role, responsibilities, and what makes it exciting..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requirements / Skills *
                  </label>
                  <textarea
                    name="requirements"
                    required
                    rows={4}
                    value={formData.requirements}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                    placeholder="List required skills separated by commas (e.g., React, TypeScript, Node.js, MongoDB)"
                  />
                  <div className="flex items-start gap-2 mt-1">
                    <FaInfoCircle className="text-xs text-gray-400 mt-0.5" />
                    <p className="text-xs text-gray-400">
                      Enter skills separated by commas. This helps our AI match qualified candidates.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    required
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                    placeholder="Email for applications"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Applicants will use this email to contact you
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#1A2A4A] text-white rounded-md hover:bg-[#2a3d6e] disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {loading ? <><FaSpinner className="animate-spin" /> Posting...</> : "Post Job"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;