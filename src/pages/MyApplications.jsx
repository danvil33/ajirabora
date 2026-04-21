import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApplicationsByUser, withdrawApplication, confirmInterview } from "../services/applicationService";
import Header from "../Components/Header/Header";
import { 
  BiBriefcase, 
  BiTime, 
  BiCheckCircle, 
  BiXCircle,
  BiLoader,
  BiTrash,
  BiBuilding,
  BiMapPin,
  BiCalendar,
  BiRefresh,
  BiVideo,
  BiPhone,
  BiLink,
  BiMessage,
  BiUser,
  BiStar,
  BiCheck,
  BiX
} from "react-icons/bi";
import { FaVideo, FaPhoneAlt, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaClock } from "react-icons/fa";

const MyApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(null);
  const [confirmingInterview, setConfirmingInterview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const apps = await getApplicationsByUser(user.uid);
      setApplications(apps);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError("Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) return;
    
    setWithdrawing(applicationId);
    try {
      await withdrawApplication(applicationId);
      setApplications(applications.filter(app => app.id !== applicationId));
      alert("Application withdrawn successfully");
    } catch (error) {
      console.error("Error withdrawing application:", error);
      alert("Failed to withdraw application. Please try again.");
    } finally {
      setWithdrawing(null);
    }
  };

  const handleConfirmInterview = async (applicationId) => {
    if (!window.confirm("Confirm your attendance for this interview?")) return;
    
    setConfirmingInterview(applicationId);
    try {
      await confirmInterview(applicationId, "I confirm my attendance");
      fetchApplications();
      alert("Interview confirmed! Check your email for details.");
    } catch (error) {
      console.error("Error confirming interview:", error);
      alert("Failed to confirm interview. Please try again.");
    } finally {
      setConfirmingInterview(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-amber-100 text-amber-700", icon: BiLoader, text: "Pending Review" },
      reviewed: { color: "bg-blue-100 text-blue-700", icon: BiTime, text: "Reviewed" },
      interview: { color: "bg-purple-100 text-purple-700", icon: BiVideo, text: "Interview Scheduled" },
      shortlisted: { color: "bg-green-100 text-green-700", icon: BiCheckCircle, text: "Shortlisted" },
      rejected: { color: "bg-red-100 text-red-700", icon: BiXCircle, text: "Not Selected" },
      hired: { color: "bg-emerald-100 text-emerald-700", icon: BiCheckCircle, text: "Hired" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="text-xs" />
        {config.text}
      </span>
    );
  };

  const getInterviewTypeIcon = (type) => {
    switch(type) {
      case 'video': return <BiVideo className="text-purple-500" />;
      case 'phone': return <BiPhone className="text-blue-500" />;
      default: return <FaBuilding className="text-gray-500" />;
    }
  };

  const getInterviewStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1"><BiCheck /> Confirmed</span>;
      case 'completed':
        return <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Cancelled</span>;
      default:
        return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1"><BiTime /> Awaiting Confirmation</span>;
    }
  };

  const getSelectionStatusBadge = (status) => {
    switch(status) {
      case 'shortlisted':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1"><BiStar /> Shortlisted</span>;
      case 'selected':
        return <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1"><BiCheck /> Selected</span>;
      case 'rejected':
        return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1"><BiX /> Not Selected</span>;
      case 'on-hold':
        return <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1"><BiTime /> On Hold</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatInterviewDateTime = (date, time) => {
    const interviewDate = new Date(date);
    return interviewDate.toLocaleDateString("en-US", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ` at ${time}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-800">
        <div className="text-center">
          <BiBriefcase className="text-6xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please login to view your applications</p>
          <Link to="/login" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <Header />
      
      <div className="pt-20 pb-24 px-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track and manage your job applications
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
            title="Refresh"
          >
            <BiRefresh className={`text-2xl ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white dark:bg-slate-700 rounded-xl p-12 text-center">
            <BiBriefcase className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No applications yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You haven't applied for any jobs yet. Start your career journey today!
            </p>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 dark:border-slate-600"
              >
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {app.jobTitle}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <BiBuilding />
                          {app.jobCompany}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <BiMapPin />
                          {app.jobLocation || "Remote"}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        {getStatusBadge(app.status)}
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <BiCalendar />
                          Applied: {formatDate(app.appliedAt)}
                        </span>
                      </div>
                    </div>
                    
                    {app.status === "pending" && (
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        disabled={withdrawing === app.id}
                        className="self-start px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm flex items-center gap-1"
                      >
                        {withdrawing === app.id ? (
                          <>
                            <BiLoader className="animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          <>
                            <BiTrash />
                            Withdraw
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Selection Comment Section */}
                  {app.selectionComment && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                          <BiMessage className="text-blue-500" />
                          Employer Feedback
                        </h4>
                        {getSelectionStatusBadge(app.selectionStatus)}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {app.selectionComment}
                      </p>
                      {app.selectionUpdatedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Updated: {formatDate(app.selectionUpdatedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Interview Section */}
                  {app.interview && app.interview.scheduled && (
                    <div className="mt-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                          {getInterviewTypeIcon(app.interview.type)}
                          Interview Scheduled!
                        </h4>
                        {getInterviewStatusBadge(app.interview.status)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <FaCalendarAlt className="text-purple-500" />
                          <strong>Date:</strong> {formatInterviewDateTime(app.interview.date, app.interview.time)}
                        </p>
                        
                        <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <strong>Type:</strong> {app.interview.type === 'video' ? '🎥 Video Interview' : app.interview.type === 'phone' ? '📞 Phone Call' : '🏢 In-person'}
                        </p>
                        
                        {app.interview.location && (
                          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <FaMapMarkerAlt className="text-purple-500" />
                            <strong>Location:</strong> {app.interview.location}
                          </p>
                        )}
                        
                        {app.interview.link && (
                          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <BiLink className="text-purple-500" />
                            <strong>Meeting Link:</strong> 
                            <a href={app.interview.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                              {app.interview.link}
                            </a>
                          </p>
                        )}
                        
                        {app.interview.instructions && (
                          <div className="mt-2 p-2 bg-white dark:bg-slate-600 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">📋 Instructions:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {app.interview.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {app.interview.status === 'pending' && (
                        <button
                          onClick={() => handleConfirmInterview(app.id)}
                          disabled={confirmingInterview === app.id}
                          className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          {confirmingInterview === app.id ? (
                            <BiLoader className="animate-spin" />
                          ) : (
                            <BiCheckCircle />
                          )}
                          Confirm Interview Attendance
                        </button>
                      )}
                    </div>
                  )}

                  {/* Cover Letter Section */}
                  {app.coverLetter && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-600 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Cover Letter:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {app.coverLetter}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;