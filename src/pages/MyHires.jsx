import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { 
  FaBriefcase, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSpinner,
  FaUser,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaEye,
  FaComments
} from "react-icons/fa";

const MyHires = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (user) {
      fetchMyProjects();
    }
  }, [user]);

  const fetchMyProjects = async () => {
    try {
      const projectsRef = collection(db, "freelance_projects");
      const q = query(projectsRef, where("employerId", "==", user.uid));
      const snapshot = await getDocs(q);
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by newest first
      projectsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", icon: FaClock, text: "Pending Acceptance" },
      accepted: { color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400", icon: FaSpinner, text: "In Progress" },
      submitted: { color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400", icon: FaSpinner, text: "Submitted for Review" },
      completed: { color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", icon: FaCheckCircle, text: "Completed" },
      cancelled: { color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", icon: FaTimesCircle, text: "Cancelled" }
    };
    const cfg = config[status] || config.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
        <Icon className="text-xs" /> {cfg.text}
      </span>
    );
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

  const getProgressPercentage = (status) => {
    const progress = {
      pending: 25,
      accepted: 50,
      submitted: 75,
      completed: 100,
      cancelled: 0
    };
    return progress[status] || 25;
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
          <div className="text-center p-6">
            <FaBriefcase className="text-5xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Please login to view your hires</p>
            <Link to="/login" className="mt-4 inline-block text-[#FF8C00] dark:text-orange-400 hover:underline">
              Login →
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Hires</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track all your hired freelancers and projects</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <FaSpinner className="animate-spin text-3xl text-[#FF8C00] dark:text-orange-400" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-gray-100 dark:border-slate-700">
              <FaBriefcase className="text-5xl text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">You haven't hired any freelancers yet.</p>
              <Link to="/freelancers" className="mt-4 inline-block text-[#FF8C00] dark:text-orange-400 hover:underline">
                Browse Freelancers →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <div key={project.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{project.title}</h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{project.description}</p>
                      
                      {/* Progress Bar */}
                      {project.status !== "cancelled" && project.status !== "completed" && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Project Progress</span>
                            <span>{getProgressPercentage(project.status)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div 
                              className="bg-[#FF8C00] dark:bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${getProgressPercentage(project.status)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FaUser className="text-gray-400 dark:text-gray-500" /> 
                          {project.freelancerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaMoneyBillWave className="text-gray-400 dark:text-gray-500" /> 
                          TZS {project.budget?.toLocaleString()}
                        </span>
                        {project.deadline && (
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt className="text-gray-400 dark:text-gray-500" /> 
                            Due: {formatDate(project.deadline)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FaClock className="text-gray-400 dark:text-gray-500" /> 
                          Hired: {formatDate(project.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/project/${project.id}`}
                        className="px-4 py-2 text-sm text-[#FF8C00] dark:text-orange-400 border border-[#FF8C00] dark:border-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors flex items-center gap-1"
                      >
                        <FaEye className="text-xs" />
                        Details
                      </Link>
                      {project.status === "submitted" && (
                        <Link
                          to={`/project/${project.id}/review`}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <FaCheckCircle className="text-xs" />
                          Review Work
                        </Link>
                      )}
                      {project.status === "accepted" && (
                        <Link
                          to={`/project/${project.id}/message`}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <FaComments className="text-xs" />
                          Message
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Section */}
          {projects.length > 0 && (
            <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {projects.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Projects</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {projects.filter(p => p.status === "accepted").length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {projects.filter(p => p.status === "submitted").length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pending Review</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {projects.filter(p => p.status === "completed").length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyHires;