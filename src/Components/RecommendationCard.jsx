import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaChartLine, FaInfoCircle } from "react-icons/fa";

const RecommendationCard = ({ job }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getMatchColor = (score) => {
    if (score >= 85) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (score >= 70) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  };
  
  const getMatchLabel = (score) => {
    if (score >= 85) return "Excellent Match! 🎯";
    if (score >= 70) return "Good Match 👍";
    return "Fair Match";
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-3 flex-1">
            {job.logo ? (
              <img src={job.logo} alt={job.company} className="w-10 h-10 object-contain rounded-lg" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-[#FF8C00] text-xl" />
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
            {job.matchScore}% Match
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 mt-2">
          {job.description?.substring(0, 80)}...
        </p>
        
        {/* Match Breakdown */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-[#FF8C00] flex items-center gap-1 mb-2 hover:underline"
        >
          <FaInfoCircle /> Why this match?
        </button>
        
        {showDetails && job.matchBreakdown && (
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3 text-xs">
            <p className="font-semibold mb-2">Match Breakdown:</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Skills Match:</span>
                <span className="font-medium">{job.matchBreakdown.skills.score}/{job.matchBreakdown.skills.max}</span>
              </div>
              <div className="flex justify-between">
                <span>Experience:</span>
                <span className="font-medium">{job.matchBreakdown.experience.score}/{job.matchBreakdown.experience.max}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-medium">{job.matchBreakdown.location.score}/{job.matchBreakdown.location.max}</span>
              </div>
              <div className="flex justify-between">
                <span>Salary:</span>
                <span className="font-medium">{job.matchBreakdown.salary.score}/{job.matchBreakdown.salary.max}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {job.type && (
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-md">
              {job.type}
            </span>
          )}
          <span className="text-xs text-gray-500 flex items-center gap-1">
            📍 {job.location || "Remote"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {getMatchLabel(job.matchScore)}
          </span>
          <Link 
            to={`/job/${job.id}/apply`}
            className="text-sm bg-[#FF8C00] text-white px-4 py-1.5 rounded-lg hover:bg-orange-600 transition"
          >
            Apply Now →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;