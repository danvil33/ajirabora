import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getJobs, deleteJob } from "../services/jobService";
import Header from "../Components/Header/Header";
import { 
  HiBriefcase, 
  HiTrash, 
  HiPlus, 
  HiChartBar,
  HiCalendar,
  HiLocationMarker,
  HiCurrencyDollar,
  HiUserGroup,
  HiEye
} from "react-icons/hi";
import { BiTimeFive } from "react-icons/bi";

const Dashboard = () => {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    views: 0,
    applications: 0
  });

  useEffect(() => {
    if (user) {
      fetchMyJobs();
    }
  }, [user]);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      setError("");
      const allJobs = await getJobs();
      const userJobs = allJobs.filter(job => job.postedBy === user.uid);
      setMyJobs(userJobs);
      
      // Calculate stats
      setStats({
        total: userJobs.length,
        active: userJobs.filter(job => job.status !== "closed").length,
        views: userJobs.reduce((sum, job) => sum + (job.views || 0), 0),
        applications: userJobs.reduce((sum, job) => sum + (job.applications || 0), 0)
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      setDeleting(jobId);
      try {
        await deleteJob(jobId);
        setMyJobs(myJobs.filter(job => job.id !== jobId));
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          active: prev.active - 1
        }));
      } catch (error) {
        console.error("Error deleting job:", error);
        alert("Failed to delete job. Please try again.");
      } finally {
        setDeleting(null);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-800">
        <div className="text-center p-6">
          <HiUserGroup className="text-6xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please login to view your dashboard</p>
          <Link to="/login" className="inline-block bg-[#2a68ff] text-white px-6 py-2 rounded-lg hover:bg-blue-600">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <Header />
      
      <div className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.displayName || user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your job postings and track applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-700 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <HiBriefcase className="text-2xl text-blue-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
          </div>
          
          <div className="bg-white dark:bg-slate-700 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <HiChartBar className="text-2xl text-green-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
          </div>
          
          <div className="bg-white dark:bg-slate-700 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <HiEye className="text-2xl text-purple-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.views}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
          </div>
          
          <div className="bg-white dark:bg-slate-700 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <HiUserGroup className="text-2xl text-orange-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.applications}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Applications</p>
          </div>
        </div>

        {/* Action Button - Mobile Optimized */}
        <div className="mb-6">
          <Link
            to="/post-job"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2a68ff] text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
          >
            <HiPlus className="text-xl" />
            <span>Post New Job</span>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Jobs List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            My Job Postings
            {myJobs.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">({myJobs.length})</span>
            )}
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a68ff]"></div>
            </div>
          ) : myJobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-700 rounded-xl p-12 text-center">
              <HiBriefcase className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven't posted any jobs yet.
              </p>
              <Link
                to="/post-job"
                className="inline-flex items-center gap-2 text-[#2a68ff] hover:text-blue-700 font-medium"
              >
                <HiPlus />
                Post your first job →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {myJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {job.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-3 mb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            <HiBriefcase className="text-xs" />
                            {job.company}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            <HiLocationMarker className="text-xs" />
                            {job.location || "Remote"}
                          </p>
                          {job.salary && (
                            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                              <HiCurrencyDollar className="text-xs" />
                              {job.salary}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <BiTimeFive className="text-xs" />
                            {formatDate(job.postedAt)}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {job.type && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {job.type}
                            </span>
                          )}
                          {job.level && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              {job.level}
                            </span>
                          )}
                          {job.status === "active" ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              Closed
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {job.desc}
                        </p>
                      </div>
                      
                      <div className="flex flex-row sm:flex-col gap-2 sm:min-w-[100px]">
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={deleting === job.id}
                          className="flex-1 sm:w-full px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <HiTrash />
                          {deleting === job.id ? "Deleting..." : "Delete"}
                        </button>
                        <button
                          className="flex-1 sm:w-full px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <HiEye />
                          View
                        </button>
                      </div>
                    </div>
                    
                    {/* Mobile Stats Row */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-slate-600 sm:hidden">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {job.views || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Applications</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {job.applications || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;