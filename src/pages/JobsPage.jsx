import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getJobs } from "../services/jobService";
import { useAuth } from "../Context/AuthContext";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { 
  BiTimeFive, 
  BiMoney, 
  BiMapPin, 
  BiBriefcase,
  BiBuilding,
  BiUser,
  BiSearch,
  BiFilter,
  BiX,
  BiFile
} from "react-icons/bi";
import { FaWhatsapp, FaArrowRight } from "react-icons/fa";

const JobsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyTerm, setCompanyTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [sortBy, setSortBy] = useState("Relevance");
  const [selectedType, setSelectedType] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterAndSortJobs();
  }, [jobs, searchTerm, companyTerm, locationTerm, sortBy, selectedType, selectedLevel]);

  const fetchJobs = async () => {
    try {
      const fetchedJobs = await getJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortJobs = () => {
    let filtered = [...jobs];

    if (searchTerm) {
      filtered = filtered.filter((job) =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (companyTerm) {
      filtered = filtered.filter((job) =>
        job.company?.toLowerCase().includes(companyTerm.toLowerCase())
      );
    }

    if (locationTerm) {
      filtered = filtered.filter((job) =>
        job.location?.toLowerCase().includes(locationTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter((job) => job.type === selectedType);
    }

    if (selectedLevel) {
      filtered = filtered.filter((job) => job.level === selectedLevel);
    }

    if (sortBy === "Relevance") {
      // Keep original order
    } else if (sortBy === "Inclusive") {
      filtered.sort((a, b) => a.title?.localeCompare(b.title));
    } else if (sortBy === "Starts") {
      filtered.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    }

    setFilteredJobs(filtered);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setCompanyTerm("");
    setLocationTerm("");
    setSortBy("Relevance");
    setSelectedType("");
    setSelectedLevel("");
  };

  const handleApplyClick = (job) => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/job/${job.id}/apply`);
  };

  const shareOnWhatsApp = (job) => {
    const message = `🚨 *JOB ALERT: ${job.title} at ${job.company}*\n\n` +
                    `📍 *Location:* ${job.location || 'Remote'}\n` +
                    `${job.salary ? `💰 *Salary:* ${job.salary}\n` : ''}` +
                    `📋 *Type:* ${job.type || 'Fulltime'}\n` +
                    `📊 *Level:* ${job.level || 'Not specified'}\n\n` +
                    `📝 *Description:* ${job.description?.substring(0, 150)}...\n` +
                    `📋 *Requirements:* ${job.requirements?.substring(0, 150)}...\n\n` +
                    `🔗 *Apply here:* ${window.location.origin}/job/${job.id}/apply\n\n` +
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

  const hasActiveFilters = searchTerm || companyTerm || locationTerm || selectedType || selectedLevel || sortBy !== "Relevance";

  return (
    <>
      <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Browse Jobs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Find your dream job from thousands of opportunities
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <BiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Search by job title, company, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white text-base"
              />
            </div>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg"
          >
            <BiFilter />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 bg-[#FF8C00] rounded-full"></span>
            )}
          </button>

          {/* Advanced Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-6`}>
            <div className="bg-white dark:bg-slate-700 rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    placeholder="Search company..."
                    value={companyTerm}
                    onChange={(e) => setCompanyTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <BiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="City, country or remote..."
                      value={locationTerm}
                      onChange={(e) => setLocationTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value="Fulltime">Full Time</option>
                    <option value="Parttime">Part Time</option>
                    <option value="Remote">Remote</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white"
                  >
                    <option value="">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Experienced">Experienced</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-slate-600">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-600 dark:text-white text-sm"
                  >
                    <option value="Relevance">Relevance</option>
                    <option value="Inclusive">Title A-Z</option>
                    <option value="Starts">Newest First</option>
                  </select>
                </div>
                
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <BiX />
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Found {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="md:hidden text-sm text-red-600 flex items-center gap-1"
              >
                <BiX />
                Clear Filters
              </button>
            )}
          </div>

          {/* Jobs List */}
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
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
              <BiBriefcase className="text-5xl text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No jobs found matching your criteria</p>
              <button onClick={clearAllFilters} className="mt-3 text-[#FF8C00] hover:underline">Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map(job => (
                <div key={job.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 dark:border-slate-700 group">
                  <div className="p-4">
                    {/* Header with Logo and Title */}
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

                    {/* Job Type Badge */}
                    {job.type && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-md">
                          <BiBriefcase className="text-xs" />
                          {job.type}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {job.description || "No description provided"}
                    </p>

                    {/* Requirements */}
                    {job.requirements && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                          <BiFile className="text-xs mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{job.requirements.substring(0, 80)}...</span>
                        </p>
                      </div>
                    )}

                    {/* Location and Time */}
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

                    {/* Salary */}
                    {job.salary && (
                      <div className="mb-2">
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <BiMoney className="text-xs" />
                          {job.salary}
                        </span>
                      </div>
                    )}

                    {/* Experience Level */}
                    {job.level && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <BiUser className="text-xs" />
                          {job.level}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApplyClick(job)}
                        className="flex-1 text-center bg-[#1A2A4A] text-white text-sm font-medium rounded-lg py-2 hover:bg-[#243b66] transition-colors"
                      >
                        Apply Now
                      </button>
                      
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
              ))}
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default JobsPage;