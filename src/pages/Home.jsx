import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Footer, Value } from "../Components";
import Header from "../Components/Header/Header";
import { getJobs } from "../services/jobService";
import { useAuth } from "../Context/AuthContext";
import { getRecommendedJobs } from "../services/matchingService";
import { 
  BiTimeFive, 
  BiMoney, 
  BiMapPin, 
  BiBriefcase,
  BiBuilding,
  BiUser,
  BiHelpCircle,
  BiPhone,
  BiMailSend,
  BiMap,
  BiFile,
  BiCheckCircle,
  BiInfoCircle,
  BiLinkExternal
} from "react-icons/bi";
import { FaWhatsapp, FaArrowRight, FaUsers, FaRegClock, FaSpinner, FaSearch, FaStar, FaChartLine, FaExternalLinkAlt } from "react-icons/fa";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isJobSeeker, setIsJobSeeker] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState({});

  useEffect(() => {
    fetchData();
    checkUserRole();
  }, []);

  useEffect(() => {
    if (user && isJobSeeker && allJobs.length > 0) {
      loadRecommendations();
    }
  }, [user, isJobSeeker, allJobs]);

  const checkUserRole = async () => {
    if (user) {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("../firebase/config");
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.data()?.role;
        setIsJobSeeker(role === "jobseeker");
      } catch (error) {
        console.error("Error checking role:", error);
      }
    }
  };

  const fetchData = async () => {
    try {
      const fetchedJobs = await getJobs();
      setAllJobs(fetchedJobs);
      
      const typeMap = {};
      fetchedJobs.forEach(job => {
        if (job.type) typeMap[job.type] = (typeMap[job.type] || 0) + 1;
      });
      
      const categoryList = Object.entries(typeMap).map(([name, count]) => ({
        name,
        count,
        icon: BiBriefcase
      }));
      setCategories(categoryList);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const activeJobs = allJobs.filter(job => job.status !== "closed");
      // Get top 4 recommendations with match scores
      const recommendations = await getRecommendedJobs(user.uid, activeJobs, 4);
      setRecommendedJobs(recommendations);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleApplyClick = (job) => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // For external jobs, open external URL directly
    if (job.jobSource === "external" && job.externalUrl) {
      window.open(job.externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/job/${job.id}/apply`);
    }
  };

  const shareOnWhatsApp = (job) => {
    const applyUrl = job.jobSource === "external" && job.externalUrl 
      ? job.externalUrl 
      : `${window.location.origin}/job/${job.id}/apply`;
    
    const message = `🚨 *JOB ALERT: ${job.title} at ${job.company}*\n\n` +
                    `📍 *Location:* ${job.location || 'Remote'}\n` +
                    `${job.salary ? `💰 *Salary:* ${job.salary}\n` : ''}` +
                    `📋 *Type:* ${job.type || 'Fulltime'}\n` +
                    `📊 *Level:* ${job.level || 'Not specified'}\n` +
                    `${job.matchScore ? `🎯 *Match Score:* ${job.matchScore}%\n` : ''}` +
                    `${job.jobSource === "external" ? `🌐 *Source:* ${job.sourcePlatform || 'External'}\n` : ''}\n` +
                    `🔗 *Apply here:* ${applyUrl}\n\n` +
                    `Share with someone looking for work! 🔁`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const formatTimePosted = (postedAt) => {
    if (!postedAt) return "Recently";
    const diffHours = Math.floor((new Date() - new Date(postedAt)) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getMatchColor = (score) => {
    if (score >= 80) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (score >= 60) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  };

  const getMatchLabel = (score) => {
    if (score >= 85) return "Excellent Match! 🎯";
    if (score >= 70) return "Great Match 👍";
    if (score >= 60) return "Good Match";
    return "Fair Match";
  };

  const toggleMatchDetails = (jobId) => {
    setShowMatchDetails(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const getSourceBadge = (source) => {
    switch(source) {
      case 'linkedin':
        return <span className="text-xs text-[#0077B5]">LinkedIn</span>;
      case 'indeed':
        return <span className="text-xs text-[#2164F4]">Indeed</span>;
      case 'brightermonday':
        return <span className="text-xs text-green-600">BrighterMonday</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          
          {/* AI Recommendations Section - ONLY for Job Seekers */}
          {user && isJobSeeker && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaChartLine className="text-[#FF8C00]" />
                    AI Recommended for You
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Based on your skills and profile</p>
                </div>
                <Link to="/jobs" className="text-sm text-[#FF8C00] hover:underline flex items-center gap-1">
                  View all jobs <FaArrowRight className="text-xs" />
                </Link>
              </div>

              {recommendationsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full mt-3"></div>
                    </div>
                  ))}
                </div>
              ) : recommendedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendedJobs.map((job) => {
                    const isExternal = job.jobSource === "external";
                    
                    return (
                      <div key={job.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-slate-700 group">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-start gap-3 flex-1">
                              {job.logo ? (
                                <img src={job.logo} alt={job.company} className="w-10 h-10 object-contain rounded-lg" />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 rounded-lg flex items-center justify-center">
                                  <BiBuilding className="text-[#FF8C00] text-xl" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                  {job.title}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{job.company}</p>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-bold ${getMatchColor(job.matchScore)}`}>
                              {job.matchScore}%
                            </div>
                          </div>
                          
                          {/* External Badge */}
                          {isExternal && (
                            <div className="mb-2 mt-1">
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                                <FaExternalLinkAlt className="text-xs" />
                                External
                                {job.sourcePlatform && getSourceBadge(job.sourcePlatform)}
                              </span>
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 mt-2">
                            {job.description?.substring(0, 80)}...
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {!isExternal && job.type && (
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-md">
                                {job.type}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <BiMapPin className="text-xs" />
                              {job.location || "Remote"}
                            </span>
                          </div>
                          
                          {/* Match Label */}
                          <div className="mb-2">
                            <span className="text-xs font-medium text-[#FF8C00]">
                              {getMatchLabel(job.matchScore)}
                            </span>
                          </div>
                          
                          {/* Match Details Toggle - Only for internal jobs */}
                          {!isExternal && job.matchReasons && job.matchReasons.length > 0 && (
                            <div className="mb-3">
                              <button
                                onClick={() => toggleMatchDetails(job.id)}
                                className="text-xs text-gray-500 hover:text-[#FF8C00] flex items-center gap-1 transition"
                              >
                                <BiInfoCircle />
                                {showMatchDetails[job.id] ? "Hide details" : "Why this match?"}
                              </button>
                              
                              {showMatchDetails[job.id] && (
                                <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-xs space-y-1">
                                  {job.matchReasons.map((reason, idx) => (
                                    <div key={idx} className="text-gray-600 dark:text-gray-400">
                                      {reason}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleApplyClick(job)}
                            className={`w-full text-center text-white text-sm font-medium rounded-lg py-2 transition-colors flex items-center justify-center gap-2 ${
                              isExternal 
                                ? "bg-purple-600 hover:bg-purple-700" 
                                : "bg-[#FF8C00] hover:bg-orange-600"
                            }`}
                          >
                            {isExternal ? (
                              <>
                                <FaExternalLinkAlt className="text-xs" />
                                Visit & Apply
                              </>
                            ) : (
                              "Apply Now →"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-gray-100 dark:border-slate-700">
                  <FaSearch className="text-4xl text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Complete your profile to get personalized job recommendations!</p>
                  <Link to="/profile" className="mt-3 inline-block text-[#FF8C00] hover:underline text-sm">
                    Complete Profile →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Job Categories */}
          {categories.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BiBriefcase className="text-[#FF8C00]" />
                Job Categories
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories.map((cat, idx) => (
                  <Link
                    key={idx}
                    to="/jobs"
                    className="bg-white dark:bg-slate-800 p-3 rounded-lg text-center hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-700 group"
                  >
                    <BiBriefcase className="mx-auto text-[#FF8C00] text-xl mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block truncate">
                      {cat.name}
                    </span>
                    <span className="text-xs text-gray-500">{cat.count} jobs</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All Jobs Section */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BiBriefcase className="text-[#FF8C00]" />
                Available Job Opportunities
              </h2>
              <p className="text-sm text-gray-500">{allJobs.length} jobs available</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full mt-3"></div>
                    <div className="flex gap-2 mt-3">
                      <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
                      <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : allJobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
                <BiBriefcase className="text-5xl text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No jobs posted yet. Be the first to post a job!</p>
                <Link to="/post-job" className="mt-3 inline-block text-[#FF8C00] hover:underline">Post a job →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allJobs.map(job => {
                  const isExternal = job.jobSource === "external";
                  
                  return (
                    <div key={job.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 dark:border-slate-700 group">
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          {job.logo ? (
                            <img
                              src={job.logo}
                              alt={job.company}
                              className="w-12 h-12 object-contain rounded-lg border p-1 bg-white"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg flex items-center justify-center">
                              <BiBuilding className="text-[#FF8C00] text-xl" />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#FF8C00] transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                              <BiBuilding className="text-xs" />
                              {job.company}
                            </p>
                          </div>
                        </div>

                        {/* External Badge */}
                        {isExternal && (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                              <FaExternalLinkAlt className="text-xs" />
                              External
                              {job.sourcePlatform && ` • ${job.sourcePlatform.charAt(0).toUpperCase() + job.sourcePlatform.slice(1)}`}
                            </span>
                          </div>
                        )}

                        {/* Internal job type badge */}
                        {!isExternal && job.type && (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-md">
                              <BiBriefcase className="text-xs" />
                              {job.type}
                            </span>
                          </div>
                        )}

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {job.description || "No description provided"}
                        </p>

                        {/* Requirements - Only for internal jobs */}
                        {!isExternal && job.requirements && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                              <BiFile className="text-xs mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{job.requirements.substring(0, 80)}...</span>
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <BiMapPin className="text-gray-400 text-xs" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {job.location || "Remote"}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <BiTimeFive className="text-xs" />
                            {formatTimePosted(job.postedAt)}
                          </span>
                        </div>

                        {job.salary && (
                          <div className="mb-2">
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <BiMoney className="text-xs" />
                              {job.salary}
                            </span>
                          </div>
                        )}

                        {job.level && (
                          <div className="mb-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <BiUser className="text-xs" />
                              {job.level}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2 mt-2">
                          {isExternal ? (
                            <a
                              href={job.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center bg-purple-600 text-white text-sm font-medium rounded-lg py-2 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <FaExternalLinkAlt className="text-xs" />
                              Visit & Apply
                            </a>
                          ) : (
                            <button
                              onClick={() => handleApplyClick(job)}
                              className="flex-1 text-center bg-[#1A2A4A] text-white text-sm font-medium rounded-lg py-2 hover:bg-[#243b66] transition-colors"
                            >
                              Apply Now
                            </button>
                          )}
                          
                          <button
                            onClick={() => shareOnWhatsApp(job)}
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center"
                            title="Share on WhatsApp"
                          >
                            <FaWhatsapp className="text-lg" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FAQ & Contact Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <BiHelpCircle className="text-[#FF8C00] text-2xl" /> 
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <BiCheckCircle className="text-green-500 text-sm" />
                    How do I register?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">Click "Register", fill in your email and password, then verify your email to activate your account.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <BiCheckCircle className="text-green-500 text-sm" />
                    How do I apply for jobs?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">Browse available jobs, click "Apply Now", then submit your application with a cover letter.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <BiCheckCircle className="text-green-500 text-sm" />
                    How can I reset my password?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">Use the "Forgot Password" link on the login page. You'll receive an email with reset instructions.</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <BiPhone className="text-[#FF8C00] text-2xl" /> 
                Contact Us
              </h2>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <p className="flex items-center gap-3">
                  <BiPhone className="text-[#FF8C00]" />
                  <span>+255 743 470 389</span>
                </p>
                <p className="flex items-center gap-3">
                  <BiMailSend className="text-[#FF8C00]" />
                  <span>support@ajiabora.com</span>
                </p>
                <p className="flex items-center gap-3">
                  <BiMap className="text-[#FF8C00]" />
                  <span>Dar es Salaam, Tanzania</span>
                </p>
                <p className="flex items-center gap-3">
                  <FaRegClock className="text-[#FF8C00]" />
                  <span>Monday - Friday: 08:00 - 17:00</span>
                </p>
              </div>
            </div>
          </div>

        </main>

        <Value />
        <Footer />
      </div>
    </>
  );
};

export default Home;