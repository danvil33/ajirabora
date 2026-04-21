import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getJobs } from "../services/jobService";
import { getRecommendedJobs } from "../services/matchingService";
import { FaSpinner, FaStar, FaChartLine } from "react-icons/fa";

const Recommendations = () => {
  const { user } = useAuth();
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const allJobs = await getJobs();
      const activeJobs = allJobs.filter(job => job.status !== "closed");
      const recommendations = await getRecommendedJobs(user.uid, activeJobs, 4);
      setRecommendedJobs(recommendations);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <FaSpinner className="animate-spin text-2xl text-[#FF8C00]" />
      </div>
    );
  }

  if (recommendedJobs.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaChartLine className="text-[#FF8C00]" />
            Recommended for You
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Based on your profile</p>
        </div>
        <Link to="/jobs" className="text-sm text-[#FF8C00] hover:underline">
          View all →
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendedJobs.map((job) => (
          <div key={job.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{job.title}</h3>
              <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                job.matchScore >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                job.matchScore >= 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              }`}>
                {job.matchScore}%
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{job.company}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3 line-clamp-2">{job.desc}</p>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">{job.location || "Remote"}</span>
              <Link to={`/job/${job.id}/apply`} className="text-sm text-[#FF8C00] hover:underline">
                Apply →
              </Link>
            </div>
            
            {job.matchScore >= 80 && (
              <div className="mt-2 flex items-center gap-1">
                <FaStar className="text-yellow-500 text-xs" />
                <span className="text-xs text-gray-500">Top match for you</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;