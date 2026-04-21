import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApplicationsByJob, updateApplicationStatus, scheduleInterview, addSelectionComment } from "../services/applicationService";
import { getJobById } from "../services/jobService";
import Header from "../Components/Header/Header";
import { 
  HiArrowLeft,
  HiDownload,
  HiEye,
  HiMail,
  HiPhone,
  HiLocationMarker,
  HiAcademicCap,
  HiBriefcase,
  HiCalendar,
  HiUser,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiSearch,
  HiDocumentText,
  HiDocumentDownload,
  HiExternalLink,
  HiVideoCamera,
  HiChatAlt,
  HiFilter,
  HiCalendar as HiCalendarIcon,
  HiClock as HiClockIcon,
  HiLocationMarker as HiLocationIcon,
  HiLink
} from "react-icons/hi";
import { FaSpinner, FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";

const JobApplicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isEmployer } = useAuth();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [interviewData, setInterviewData] = useState({
    date: "",
    time: "",
    type: "in-person",
    location: "",
    link: "",
    instructions: ""
  });
  const [commentData, setCommentData] = useState({
    comment: "",
    selectionStatus: "shortlisted"
  });

  useEffect(() => {
    if (!isEmployer()) {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [jobId]);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, applications]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const jobData = await getJobById(jobId);
      setJob(jobData);
      
      const apps = await getApplicationsByJob(jobId);
      setApplications(apps);
      setFilteredApplications(apps);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];
    
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantPhone?.includes(searchTerm)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    setFilteredApplications(filtered);
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    if (!window.confirm(`Change application status to ${newStatus.toUpperCase()}?`)) return;
    
    setUpdatingStatus(applicationId);
    try {
      await updateApplicationStatus(applicationId, newStatus);
      const updatedApps = await getApplicationsByJob(jobId);
      setApplications(updatedApps);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleScheduleInterview = async (application) => {
    setSelectedApplication(application);
    setInterviewData({
      date: "",
      time: "",
      type: "in-person",
      location: "",
      link: "",
      instructions: ""
    });
    setShowInterviewModal(true);
  };

  const handleAddComment = async (application) => {
    setSelectedApplication(application);
    setCommentData({
      comment: "",
      selectionStatus: "shortlisted"
    });
    setShowCommentModal(true);
  };

  const submitInterview = async () => {
    if (!interviewData.date || !interviewData.time) {
      alert("Please select date and time");
      return;
    }

    try {
      await scheduleInterview(selectedApplication.id, {
        ...interviewData,
        scheduledBy: user.uid,
        scheduledByEmail: user.email
      });
      
      // Also update application status to "interview"
      await updateApplicationStatus(selectedApplication.id, "interview");
      
      alert(`Interview scheduled for ${selectedApplication.applicantName}`);
      setShowInterviewModal(false);
      fetchData(); // Refresh
    } catch (error) {
      console.error("Error scheduling interview:", error);
      alert("Failed to schedule interview");
    }
  };

  const submitComment = async () => {
    try {
      await addSelectionComment(selectedApplication.id, commentData.comment, commentData.selectionStatus);
      
      // Update application status based on selection
      let newStatus = selectedApplication.status;
      if (commentData.selectionStatus === "shortlisted") newStatus = "shortlisted";
      if (commentData.selectionStatus === "selected") newStatus = "hired";
      if (commentData.selectionStatus === "rejected") newStatus = "rejected";
      
      await updateApplicationStatus(selectedApplication.id, newStatus);
      
      alert(`Selection status updated for ${selectedApplication.applicantName}`);
      setShowCommentModal(false);
      fetchData(); // Refresh
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to update selection status");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: "bg-amber-100 text-amber-700", icon: HiClock, text: "Pending" },
      reviewed: { color: "bg-blue-100 text-blue-700", icon: HiEye, text: "Reviewed" },
      interview: { color: "bg-purple-100 text-purple-700", icon: HiVideoCamera, text: "Interview" },
      shortlisted: { color: "bg-green-100 text-green-700", icon: HiCheckCircle, text: "Shortlisted" },
      rejected: { color: "bg-red-100 text-red-700", icon: HiXCircle, text: "Rejected" },
      hired: { color: "bg-emerald-100 text-emerald-700", icon: HiCheckCircle, text: "Hired" }
    };
    
    const cfg = config[status] || config.pending;
    const Icon = cfg.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
        <Icon className="text-xs" />
        {cfg.text}
      </span>
    );
  };

  const getFileIcon = (url) => {
    if (!url) return <FaFileAlt className="text-gray-400" />;
    if (url.includes('.pdf')) return <FaFilePdf className="text-red-500" />;
    if (url.includes('.doc') || url.includes('.docx')) return <FaFileWord className="text-blue-500" />;
    return <FaFileAlt className="text-gray-400" />;
  };

  if (!isEmployer()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <Header />
      
      <div className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Back Button and Job Info */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 mb-4 transition-colors"
          >
            <HiArrowLeft />
            Back to Dashboard
          </button>
          
          {job && (
            <div className="bg-white dark:bg-slate-700 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-600">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <HiBriefcase />
                  {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <HiLocationMarker />
                  {job.location || "Remote"}
                </span>
                <span className="flex items-center gap-1">
                  <HiCalendar />
                  Posted: {formatDate(job.postedAt)}
                </span>
                <span className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                  <HiUser className="text-xs" />
                  {applications.length} Applicant{applications.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 bg-white dark:bg-slate-700 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-600">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-600 dark:text-white"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-600 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="interview">Interview</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white dark:bg-slate-700 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-600">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applicant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applied</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interview</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CV</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-700 divide-y divide-gray-200 dark:divide-slate-600">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <HiDocumentText className="text-5xl mx-auto mb-2 text-gray-300" />
                      No applicants found
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app, index) => (
                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-slate-600/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50 rounded-full flex items-center justify-center">
                            <HiUser className="text-indigo-600 dark:text-indigo-400 text-lg" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{app.applicantName}</p>
                            {app.applicantEducation && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                {app.applicantEducation.substring(0, 35)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <HiMail className="text-xs flex-shrink-0" /> 
                          <span className="truncate max-w-[150px]">{app.applicantEmail}</span>
                        </p>
                        {app.applicantPhone && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <HiPhone className="text-xs" /> {app.applicantPhone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(app.appliedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-4 py-3">
                        {app.interview && app.interview.scheduled ? (
                          <div className="text-xs">
                            <p className="font-medium text-purple-600">{app.interview.date}</p>
                            <p className="text-gray-500">{app.interview.time}</p>
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              app.interview.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              app.interview.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {app.interview.status || 'pending'}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleScheduleInterview(app)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            + Schedule
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {app.resumeUrl ? (
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm hover:bg-green-100 transition-colors"
                          >
                            {getFileIcon(app.resumeUrl)}
                            <span className="hidden sm:inline">View</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No resume</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <select
                            value={app.status}
                            onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                            disabled={updatingStatus === app.id}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-600 dark:text-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="interview">Interview</option>
                            <option value="shortlisted">Shortlist</option>
                            <option value="rejected">Reject</option>
                            <option value="hired">Hire</option>
                          </select>
                          <button
                            onClick={() => handleAddComment(app)}
                            className="px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded text-sm flex items-center gap-1"
                            title="Add selection comment"
                          >
                            <HiChatAlt className="text-xs" />
                            <span className="hidden sm:inline">Comment</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          {!loading && filteredApplications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-600 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800">
              Showing {filteredApplications.length} of {applications.length} applicant{applications.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Interview Scheduling Modal */}
      {showInterviewModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Schedule Interview
              </h2>
              <button
                onClick={() => setShowInterviewModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.applicantName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedApplication.applicantEmail}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedApplication.jobTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interview Date *
                  </label>
                  <input
                    type="date"
                    value={interviewData.date}
                    onChange={(e) => setInterviewData({...interviewData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interview Time *
                  </label>
                  <input
                    type="time"
                    value={interviewData.time}
                    onChange={(e) => setInterviewData({...interviewData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Interview Type *
                </label>
                <select
                  value={interviewData.type}
                  onChange={(e) => setInterviewData({...interviewData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700"
                >
                  <option value="in-person">🏢 In-person</option>
                  <option value="phone">📞 Phone Call</option>
                  <option value="video">🎥 Video Interview</option>
                </select>
              </div>

              {interviewData.type === "in-person" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location *
                  </label>
                  <textarea
                    value={interviewData.location}
                    onChange={(e) => setInterviewData({...interviewData, location: e.target.value})}
                    rows={2}
                    placeholder="Office address, building name, floor, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700"
                  />
                </div>
              )}

              {interviewData.type === "video" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Video Meeting Link *
                  </label>
                  <input
                    type="url"
                    value={interviewData.link}
                    onChange={(e) => setInterviewData({...interviewData, link: e.target.value})}
                    placeholder="https://zoom.us/... or https://meet.google.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700"
                  />
                </div>
              )}

              {interviewData.type === "phone" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={interviewData.location}
                    onChange={(e) => setInterviewData({...interviewData, location: e.target.value})}
                    placeholder="Phone number to call"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instructions / Notes (Optional)
                </label>
                <textarea
                  value={interviewData.instructions}
                  onChange={(e) => setInterviewData({...interviewData, instructions: e.target.value})}
                  rows={3}
                  placeholder="What to prepare, who they'll meet, duration, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:text-white dark:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={submitInterview}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection Comment Modal */}
      {showCommentModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full">
            <div className="border-b border-gray-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Update Selection Status
              </h2>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.applicantName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedApplication.jobTitle}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Selection Status *
                </label>
                <select
                  value={commentData.selectionStatus}
                  onChange={(e) => setCommentData({...commentData, selectionStatus: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700"
                >
                  <option value="shortlisted">⭐ Shortlisted - Moving to next round</option>
                  <option value="selected">✅ Selected - Job offered</option>
                  <option value="rejected">❌ Rejected - Not selected</option>
                  <option value="on-hold">⏳ On Hold - Decision pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Comments / Feedback *
                </label>
                <textarea
                  value={commentData.comment}
                  onChange={(e) => setCommentData({...commentData, comment: e.target.value})}
                  rows={4}
                  placeholder="Add your comments, feedback, or next steps for this candidate..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">The candidate will see this comment in their application status.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitComment}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicants;