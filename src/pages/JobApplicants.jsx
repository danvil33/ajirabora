import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import {
  getApplicationsByJob,
  updateApplicationStatus,
  scheduleInterview,
  addSelectionComment
} from "../services/applicationService";
import { getJobById } from "../services/jobService";
import Header from "../Components/Header/Header";
import {
  HiArrowLeft,
  HiEye,
  HiMail,
  HiPhone,
  HiLocationMarker,
  HiBriefcase,
  HiCalendar,
  HiUser,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiSearch,
  HiDocumentText,
  HiVideoCamera,
  HiChatAlt,
  HiX
} from "react-icons/hi";
import {
  FaSpinner,
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaRobot,
  FaTrophy,
  FaStar,
  FaTimesCircle,
  FaChartLine,
  FaCheckCircle,
  FaExclamationCircle,
  FaUserCheck,
  FaUserTimes,
  FaClipboardCheck
} from "react-icons/fa";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

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
  const [aiRanking, setAiRanking] = useState(null);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);

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
    fetchAIRanking();
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

  const fetchAIRanking = async () => {
    setLoadingRanking(true);

    try {
      const rankingDoc = await getDoc(doc(db, "rankings", jobId));

      if (rankingDoc.exists()) {
        setAiRanking(rankingDoc.data());
      }
    } catch (error) {
      console.error("Error fetching AI ranking:", error);
    } finally {
      setLoadingRanking(false);
    }
  };

  const openAIRanking = () => {
    const message = `RANK CANDIDATES FOR JOB

JOB ID: ${jobId}
JOB TITLE: ${job?.title}
COMPANY: ${job?.company}
EMPLOYER ID: ${user?.uid}

Please:
1. Call getJobApplicants API to fetch all candidates
2. Analyze each candidate's profile and CV
3. Rank candidates by match score from 0 to 100%
4. For each candidate provide strengths, weaknesses, and recommendation
5. Call saveCandidateRanking API to save results

Use a professional hiring tone. Be honest, practical, and thorough.`;

    const encodedMessage = encodeURIComponent(message);
    const gptUrl = `https://chatgpt.com/g/g-69ed8fb6dbc48191abe8b564a009e2a5-ajirabora-ai?prompt=${encodedMessage}`;

    navigator.clipboard.writeText(message);
    setShowRankingModal(true);
    window.open(gptUrl, "_blank");

    setTimeout(() => {
      fetchAIRanking();
    }, 5000);
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicantEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicantPhone?.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
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

      await updateApplicationStatus(selectedApplication.id, "interview");
      alert(`Interview scheduled for ${selectedApplication.applicantName}`);
      setShowInterviewModal(false);
      fetchData();
    } catch (error) {
      console.error("Error scheduling interview:", error);
      alert("Failed to schedule interview");
    }
  };

  const submitComment = async () => {
    try {
      await addSelectionComment(
        selectedApplication.id,
        commentData.comment,
        commentData.selectionStatus
      );

      let newStatus = selectedApplication.status;

      if (commentData.selectionStatus === "shortlisted") newStatus = "shortlisted";
      if (commentData.selectionStatus === "selected") newStatus = "hired";
      if (commentData.selectionStatus === "rejected") newStatus = "rejected";
      if (commentData.selectionStatus === "on-hold") newStatus = "reviewed";

      await updateApplicationStatus(selectedApplication.id, newStatus);

      alert(`Selection status updated for ${selectedApplication.applicantName}`);
      setShowCommentModal(false);
      fetchData();
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to update selection status");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date =
      typeof dateString?.toDate === "function"
        ? dateString.toDate()
        : new Date(dateString);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: {
        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        icon: HiClock,
        text: "Pending"
      },
      reviewed: {
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        icon: HiEye,
        text: "Reviewed"
      },
      interview: {
        color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        icon: HiVideoCamera,
        text: "Interview"
      },
      shortlisted: {
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        icon: HiCheckCircle,
        text: "Shortlisted"
      },
      rejected: {
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        icon: HiXCircle,
        text: "Rejected"
      },
      hired: {
        color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        icon: HiCheckCircle,
        text: "Hired"
      }
    };

    const cfg = config[status] || config.pending;
    const Icon = cfg.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
        <Icon className="text-sm" />
        {cfg.text}
      </span>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    if (score >= 60) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (score >= 40) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent match";
    if (score >= 60) return "Strong match";
    if (score >= 40) return "Moderate match";
    return "Low match";
  };

  const getRecommendationStyle = (rec) => {
    switch (rec) {
      case "HIRE":
        return {
          icon: FaUserCheck,
          label: "Hire candidate",
          color: "text-emerald-700 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
          border: "border-emerald-200 dark:border-emerald-800"
        };

      case "INTERVIEW":
        return {
          icon: HiVideoCamera,
          label: "Invite for interview",
          color: "text-blue-700 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800"
        };

      case "REJECT":
        return {
          icon: FaUserTimes,
          label: "Not recommended",
          color: "text-red-700 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800"
        };

      default:
        return {
          icon: FaClipboardCheck,
          label: "Review manually",
          color: "text-gray-700 dark:text-gray-300",
          bg: "bg-gray-50 dark:bg-slate-700",
          border: "border-gray-200 dark:border-slate-600"
        };
    }
  };

  const getRecommendationIcon = (rec) => {
    switch (rec) {
      case "HIRE":
        return <FaUserCheck className="text-emerald-500" />;
      case "INTERVIEW":
        return <HiVideoCamera className="text-blue-500" />;
      case "REJECT":
        return <FaUserTimes className="text-red-500" />;
      default:
        return <FaClipboardCheck className="text-gray-500" />;
    }
  };

  const getFileIcon = (url) => {
    if (!url) return <FaFileAlt className="text-gray-400" />;
    if (url.includes(".pdf")) return <FaFilePdf className="text-red-500" />;
    if (url.includes(".doc") || url.includes(".docx")) return <FaFileWord className="text-blue-500" />;
    return <FaFileAlt className="text-gray-400" />;
  };

  if (!isEmployer()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />

      <div className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FF8C00] dark:text-gray-400 dark:hover:text-[#FF8C00] mb-4 transition-colors"
          >
            <HiArrowLeft />
            Back to Dashboard
          </button>

          {job && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {job.title}
                  </h1>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <HiBriefcase className="text-[#FF8C00]" />
                      {job.company}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <HiLocationMarker className="text-[#FF8C00]" />
                      {job.location || "Remote"}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <HiCalendar className="text-[#FF8C00]" />
                      Posted: {formatDate(job.postedAt)}
                    </span>

                    <span className="flex items-center gap-1.5 bg-[#1A2A4A]/10 dark:bg-[#FF8C00]/10 text-[#1A2A4A] dark:text-[#FF8C00] px-2.5 py-1 rounded-full font-medium">
                      <HiUser className="text-sm" />
                      {applications.length} Applicant{applications.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <button
                  onClick={openAIRanking}
                  disabled={loadingRanking}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A2A4A] text-white rounded-xl font-semibold hover:bg-[#25385f] transition-all shadow-sm border border-[#FF8C00]/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingRanking ? (
                    <FaSpinner className="text-lg text-[#FF8C00] animate-spin" />
                  ) : (
                    <FaRobot className="text-lg text-[#FF8C00]" />
                  )}

                  <span>Hire with AjiraBora AI</span>

                  <span className="text-[11px] bg-[#FF8C00] text-white px-2 py-0.5 rounded-full">
                    Smart ranking
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {aiRanking && aiRanking.rankingResults && (
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-[#1A2A4A] to-[#24395f]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1 rounded-full text-xs font-medium mb-3">
                    <FaRobot className="text-[#FF8C00]" />
                    AjiraBora AI Screening
                  </div>

                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <FaChartLine className="text-[#FF8C00]" />
                    Candidate Ranking Results
                  </h2>

                  <p className="text-sm text-gray-200 mt-1">
                    AI-generated candidate match analysis based on job requirements, profile data, and CV information.
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-xs text-gray-300">Last analyzed</p>
                  <p className="text-sm font-semibold text-white">
                    {aiRanking.createdAt ? formatDate(aiRanking.createdAt) : "Recently"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {aiRanking.rankingResults.topCandidate && (
                <div className="mb-5 rounded-2xl border border-[#FF8C00]/30 bg-[#FF8C00]/10 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#1A2A4A] flex items-center justify-center shadow-sm">
                        <FaTrophy className="text-2xl text-[#FF8C00]" />
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
                          Top recommended candidate
                        </p>

                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {aiRanking.rankingResults.topCandidate}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-2xl font-black text-[#1A2A4A] dark:text-[#FF8C00]">
                        {aiRanking.rankingResults.topScore}%
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getScoreLabel(aiRanking.rankingResults.topScore)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {aiRanking.rankingResults.rankedCandidates?.slice(0, 5).map((candidate, idx) => {
                  const recStyle = getRecommendationStyle(candidate.recommendation);
                  const RecIcon = recStyle.icon;

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center font-bold text-[#1A2A4A] dark:text-white">
                            {idx + 1}
                          </div>

                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">
                              {candidate.name}
                            </h3>

                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Candidate ID: {candidate.userId || "Not available"}
                            </p>

                            <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full border text-xs font-semibold ${recStyle.bg} ${recStyle.border} ${recStyle.color}`}>
                              <RecIcon className="text-sm" />
                              {recStyle.label}
                            </div>
                          </div>
                        </div>

                        <div className="min-w-[140px]">
                          <div className={`px-4 py-2 rounded-xl text-center font-bold text-sm ${getScoreColor(candidate.matchScore)}`}>
                            {candidate.matchScore}% Match
                          </div>

                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                            {getScoreLabel(candidate.matchScore)}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-5">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <FaCheckCircle className="text-emerald-600 dark:text-emerald-400" />

                            <p className="font-semibold text-gray-900 dark:text-white">
                              Strengths
                            </p>
                          </div>

                          {candidate.strengths?.length > 0 ? (
                            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                              {candidate.strengths.slice(0, 3).map((strength, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No strengths provided.
                            </p>
                          )}
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <FaExclamationCircle className="text-amber-600 dark:text-amber-400" />

                            <p className="font-semibold text-gray-900 dark:text-white">
                              Areas to Review
                            </p>
                          </div>

                          {candidate.weaknesses?.length > 0 ? (
                            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                              {candidate.weaknesses.slice(0, 3).map((weakness, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                                  <span>{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No concerns provided.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
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

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    #
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Applicant
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Applied
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Interview
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CV
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-10 text-center">
                      <FaSpinner className="animate-spin text-3xl text-[#FF8C00] mx-auto" />
                    </td>
                  </tr>
                ) : filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                      <HiDocumentText className="text-5xl mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                      No applicants found
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app, index) => (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1A2A4A]/10 dark:bg-[#FF8C00]/10 rounded-full flex items-center justify-center">
                            <HiUser className="text-[#1A2A4A] dark:text-[#FF8C00] text-lg" />
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {app.applicantName}
                            </p>

                            {app.applicantEducation && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                {app.applicantEducation.substring(0, 35)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                          <HiMail className="text-xs flex-shrink-0 text-[#FF8C00]" />
                          <span className="truncate max-w-[150px]">
                            {app.applicantEmail}
                          </span>
                        </p>

                        {app.applicantPhone && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                            <HiPhone className="text-xs text-[#FF8C00]" />
                            {app.applicantPhone}
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
                            <p className="font-semibold text-purple-600 dark:text-purple-400">
                              {app.interview.date}
                            </p>

                            <p className="text-gray-500 dark:text-gray-400">
                              {app.interview.time}
                            </p>

                            <span
                              className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                app.interview.status === "confirmed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                  : app.interview.status === "completed"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                              }`}
                            >
                              {app.interview.status || "pending"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleScheduleInterview(app)}
                            className="text-xs text-[#1A2A4A] dark:text-[#FF8C00] hover:text-[#FF8C00] font-semibold"
                          >
                            Schedule
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {app.resumeUrl ? (
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
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
                            className="px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
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
                            className="px-2 py-1.5 text-[#1A2A4A] dark:text-[#FF8C00] hover:bg-[#FF8C00]/10 rounded-lg text-sm flex items-center gap-1"
                            title="Add selection comment"
                          >
                            <HiChatAlt className="text-sm" />

                            <span className="hidden sm:inline">
                              Comment
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredApplications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900">
              Showing {filteredApplications.length} of {applications.length} applicant{applications.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {showRankingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-slate-700">
            <div className="w-20 h-20 bg-[#1A2A4A] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaRobot className="text-4xl text-[#FF8C00]" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              AI Candidate Analysis
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mt-2">
              AjiraBora AI has started analyzing candidates for this position.
            </p>

            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-2">
                <FaCheckCircle />
                Analysis started in ChatGPT
              </p>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Results will appear on this page when the ranking is saved.
            </p>

            <button
              onClick={() => setShowRankingModal(false)}
              className="mt-5 px-6 py-2.5 bg-[#1A2A4A] text-white rounded-xl hover:bg-[#25385f] transition w-full font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showInterviewModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Schedule Interview
              </h2>

              <button
                onClick={() => setShowInterviewModal(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-700 transition"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-3">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedApplication.applicantName}
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedApplication.applicantEmail}
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedApplication.jobTitle}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Interview Date
                  </label>

                  <input
                    type="date"
                    value={interviewData.date}
                    onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Interview Time
                  </label>

                  <input
                    type="time"
                    value={interviewData.time}
                    onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Interview Type
                </label>

                <select
                  value={interviewData.type}
                  onChange={(e) => setInterviewData({ ...interviewData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                >
                  <option value="in-person">In-person interview</option>
                  <option value="phone">Phone call</option>
                  <option value="video">Video interview</option>
                </select>
              </div>

              {interviewData.type === "in-person" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>

                  <textarea
                    value={interviewData.location}
                    onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                    rows={2}
                    placeholder="Office address, building name, floor, or room number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                  />
                </div>
              )}

              {interviewData.type === "video" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Video Meeting Link
                  </label>

                  <input
                    type="url"
                    value={interviewData.link}
                    onChange={(e) => setInterviewData({ ...interviewData, link: e.target.value })}
                    placeholder="https://zoom.us/... or https://meet.google.com/..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                  />
                </div>
              )}

              {interviewData.type === "phone" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    value={interviewData.location}
                    onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                    placeholder="Phone number to call"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Instructions or Notes
                </label>

                <textarea
                  value={interviewData.instructions}
                  onChange={(e) => setInterviewData({ ...interviewData, instructions: e.target.value })}
                  rows={3}
                  placeholder="What to prepare, who they will meet, interview duration, or documents to bring"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={submitInterview}
                  className="flex-1 bg-[#1A2A4A] text-white py-2.5 rounded-xl hover:bg-[#25385f] font-semibold"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCommentModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-gray-100 dark:border-slate-700">
            <div className="border-b border-gray-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Update Selection Status
              </h2>

              <button
                onClick={() => setShowCommentModal(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-700 transition"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-3">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedApplication.applicantName}
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedApplication.jobTitle}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Selection Status
                </label>

                <select
                  value={commentData.selectionStatus}
                  onChange={(e) => setCommentData({ ...commentData, selectionStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                >
                  <option value="shortlisted">Shortlisted - Moving to next round</option>
                  <option value="selected">Selected - Job offered</option>
                  <option value="rejected">Rejected - Not selected</option>
                  <option value="on-hold">On Hold - Decision pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Comments or Feedback
                </label>

                <textarea
                  value={commentData.comment}
                  onChange={(e) => setCommentData({ ...commentData, comment: e.target.value })}
                  rows={4}
                  placeholder="Add your comments, feedback, or next steps for this candidate"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                  required
                />

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  The candidate may see this comment in their application status.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={submitComment}
                  className="flex-1 bg-[#1A2A4A] text-white py-2.5 rounded-xl hover:bg-[#25385f] font-semibold"
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