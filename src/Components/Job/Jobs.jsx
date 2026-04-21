import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BiTimeFive, BiMoney, BiBriefcase, BiMapPin, BiEnvelope, BiFile } from "react-icons/bi";
import { FaWhatsapp } from "react-icons/fa";
import { getJobs } from "../../services/jobService";

const Jobs = ({ filters, searchTrigger }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredJobs, setFilteredJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, filters, searchTrigger]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const fetchedJobs = await getJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    if (filters.searchTerm) {
      filtered = filtered.filter((job) =>
        job.title?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.companyTerm) {
      filtered = filtered.filter((job) =>
        job.company?.toLowerCase().includes(filters.companyTerm.toLowerCase())
      );
    }

    if (filters.locationTerm) {
      filtered = filtered.filter((job) =>
        job.location?.toLowerCase().includes(filters.locationTerm.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter((job) => job.type === filters.type);
    }

    if (filters.level) {
      filtered = filtered.filter((job) => job.level === filters.level);
    }

    filtered.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    setFilteredJobs(filtered);
  };

  const formatTimePosted = (postedAt) => {
    if (!postedAt) return "Recently";
    const posted = new Date(postedAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now - posted) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return posted.toLocaleDateString();
  };

  if (loading) {
    return (
      <section id="jobs">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a68ff]"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="jobs">
      <div className="flex gap-10 justify-center flex-wrap items-start py-5 sm:py-10">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No jobs found matching your criteria.
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            return (
              <div
                key={job.id}
                className="flex-grow group flex flex-col h-auto min-h-[500px] w-[350px] p-4 md:p-[20px] mt-4 bg-white rounded-md shadow-lg shadow-gray-400 dark:hover:bg-blueColor hover:bg-[#2a68ff] dark:bg-slate-700 dark:shadow-none transition-all duration-300"
              >
                <div className="upperpart">
                  <div className="flex justify-between items-start mb-3">
                    <div className="titlecountry flex-grow">
                      <p className="title font-bold group-hover:text-white text-xl dark:text-blueColor">
                        {job.title || "Untitled Position"}
                      </p>
                      <p className="text-[#8b8b8b] group-hover:text-[#dadada] dark:text-slate-400 text-sm flex items-center gap-1 mt-1">
                        <BiMapPin className="inline" />
                        {job.location || "Location not specified"}
                      </p>
                    </div>
                    <span className="text-[#8b8b8b] group-hover:text-[#dadada] dark:text-slate-300 text-sm flex items-center">
                      <BiTimeFive className="inline mr-1" />
                      {formatTimePosted(job.postedAt)}
                    </span>
                  </div>

                  <div className="flex gap-2 mb-3 flex-wrap">
                    {job.type && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full group-hover:bg-white group-hover:text-blue-600">
                        {job.type}
                      </span>
                    )}
                    {job.level && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full group-hover:bg-white group-hover:text-green-600">
                        {job.level}
                      </span>
                    )}
                    {job.salary && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full group-hover:bg-white group-hover:text-purple-600 flex items-center gap-1">
                        <BiMoney className="inline" />
                        {job.salary}
                      </span>
                    )}
                  </div>
                </div>

                <div className="lowerpart border-t-2 mt-3 pt-3 group-hover:text-white flex-grow">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-white mb-1 flex items-center gap-1">
                      <BiBriefcase className="inline" />
                      Description:
                    </p>
                    <p className="text-sm text-[#adaaaa] group-hover:text-white dark:text-slate-200 whitespace-pre-wrap">
                      {job.description && job.description.trim() !== "" 
                        ? job.description 
                        : "No description provided"}
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-white mb-1 flex items-center gap-1">
                      <BiFile className="inline" />
                      Requirements:
                    </p>
                    <p className="text-sm text-[#adaaaa] group-hover:text-white dark:text-slate-200 whitespace-pre-wrap">
                      {job.requirements && job.requirements.trim() !== "" 
                        ? job.requirements 
                        : "No specific requirements listed"}
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-white mb-1 flex items-center gap-1">
                      <BiEnvelope className="inline" />
                      Contact:
                    </p>
                    <p className="text-sm text-[#adaaaa] group-hover:text-white dark:text-slate-200 break-all">
                      {job.contactEmail || "No contact email provided"}
                    </p>
                  </div>

                  <div className="company flex justify-start items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 group-hover:border-white">
                    {job.logo ? (
                      <img
                        className="p-0"
                        src={job.logo}
                        width={30}
                        height={30}
                        alt={job.company}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold">
                        {job.company?.charAt(0) || "C"}
                      </div>
                    )}
                    <div className="ml-2">
                      <p className="text-sm font-medium dark:text-slate-300 group-hover:text-white">
                        {job.company || "Company not specified"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-200">
                        Posted by: {job.postedByEmail?.split('@')[0] || "Anonymous"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 border-[2px] font-medium rounded-[10px] block p-2 dark:text-slate-100 dark:bg-blueColor dark:border-transparent dark:group-hover:border dark:group-hover:border-white dark:hover:text-blueColor dark:hover:bg-white hover:bg-white transition-all duration-300">
                    Apply Now
                  </button>
                  
                  <button
                    onClick={() => {
                      const message = `🚨 Job Alert: ${job.title} at ${job.company}\n📍 ${job.location}\n🔗 ${window.location.origin}/jobs`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-[10px] transition-all duration-300 flex items-center gap-1"
                    title="Share on WhatsApp"
                  >
                    <FaWhatsapp className="text-lg" />
                    <span className="hidden sm:inline text-sm">Share</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default Jobs;