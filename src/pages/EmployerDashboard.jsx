import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { getEmployerJobs, deleteJob } from "../services/jobService";
import { getApplicationsByJob } from "../services/applicationService";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { 
  HiBriefcase, 
  HiTrash, 
  HiPlus, 
  HiLocationMarker, 
  HiCurrencyDollar, 
  HiUsers, 
  HiRefresh,
  HiCalendar,
  HiOfficeBuilding,
  HiCheckCircle,
  HiEye
} from "react-icons/hi";
import { FaSpinner, FaExclamationTriangle } from "react-icons/fa";

const EmployerDashboard = () => {
  const { user, userProfile, isEmployer } = useAuth();
  const navigate = useNavigate();
  const [myJobs, setMyJobs] = useState([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  const fetchMyJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const userJobs = await getEmployerJobs(user.uid);
      setMyJobs(userJobs);
      
      let totalApps = 0;
      for (const job of userJobs) {
        const apps = await getApplicationsByJob(job.id);
        totalApps += apps.length;
      }
      setApplicationsCount(totalApps);
      
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isEmployer()) {
      fetchMyJobs();
    }
  }, [user, isEmployer, fetchMyJobs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyJobs();
  };

  const handleViewApplicants = (job) => {
    navigate(`/dashboard/jobs/${job.id}/applicants`);
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      setDeleting(jobId);
      try {
        await deleteJob(jobId);
        fetchMyJobs();
      } catch (error) {
        console.error("Error deleting job:", error);
        alert("Failed to delete job. Please try again.");
      } finally {
        setDeleting(null);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now - date;
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const activeJobs = myJobs.filter(job => job.status !== "closed").length;

  if (!user || !isEmployer()) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiBriefcase className="text-3xl text-gray-400 dark:text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Employer Access Only</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Please register as an employer to access your dashboard.</p>
            <Link to="/register" className="inline-block bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white px-6 py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors">
              Register as Employer
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employer Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your job postings and track applicants</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Link 
              to="/post-job" 
              className="inline-flex items-center gap-2 bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white px-4 py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors shadow-sm"
            >
              <HiPlus className="text-lg" />
              <span>Post a Job</span>
            </Link>
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#FF8C00] dark:hover:text-orange-400 transition-colors" 
              title="Refresh"
            >
              <HiRefresh className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{myJobs.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <HiBriefcase className="text-blue-600 dark:text-blue-400 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Jobs</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{activeJobs}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <HiCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Applicants</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{applicationsCount}</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <HiUsers className="text-purple-600 dark:text-purple-400 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1 truncate max-w-[150px]">
                  {userProfile?.companyName || user.email?.split('@')[0]}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <HiOfficeBuilding className="text-[#FF8C00] dark:text-orange-400 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {/* Jobs List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Job Postings
              {myJobs.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({myJobs.length})</span>}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <FaSpinner className="animate-spin text-3xl text-[#FF8C00] dark:text-orange-400" />
            </div>
          ) : myJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiBriefcase className="text-2xl text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't posted any jobs yet.</p>
              <Link to="/post-job" className="inline-flex items-center gap-2 text-[#FF8C00] dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 font-medium transition">
                <HiPlus className="text-lg" />
                Post your first job
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {myJobs.map((job) => (
                <div key={job.id} className="p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <HiBriefcase className="text-gray-500 dark:text-gray-400 text-lg" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{job.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{job.company}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <HiLocationMarker className="text-xs" />
                              {job.location || "Remote"}
                            </span>
                            {job.salary && (
                              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <HiCurrencyDollar className="text-xs" />
                                {job.salary}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <HiCalendar className="text-xs" />
                              Posted {formatDate(job.postedAt)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {job.type && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-full">
                                {job.type}
                              </span>
                            )}
                            {job.level && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-full">
                                {job.level}
                              </span>
                            )}
                            {job.status === "active" ? (
                              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                Active
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-13 sm:ml-0">
                      <button 
                        onClick={() => handleViewApplicants(job)} 
                        className="px-4 py-2 text-sm font-medium text-[#FF8C00] dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition-colors"
                      >
                        <span className="hidden sm:inline">View Applicants</span>
                        <HiEye className="sm:hidden text-lg" />
                      </button>
                      <button 
                        onClick={() => handleDeleteJob(job.id)} 
                        disabled={deleting === job.id} 
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50" 
                        title="Delete job"
                      >
                        {deleting === job.id ? (
                          <FaSpinner className="animate-spin text-sm" />
                        ) : (
                          <HiTrash className="text-lg" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EmployerDashboard;