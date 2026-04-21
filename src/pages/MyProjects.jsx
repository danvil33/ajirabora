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
  FaUpload
} from "react-icons/fa";

const MyProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyProjects();
    }
  }, [user]);

  const fetchMyProjects = async () => {
    try {
      const projectsRef = collection(db, "freelance_projects");
      const q = query(projectsRef, where("freelancerId", "==", user.uid));
      const snapshot = await getDocs(q);
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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

  if (!user) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
          <p className="text-gray-500 dark:text-gray-400">Please login to view your projects</p>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track all your assigned projects</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <FaSpinner className="animate-spin text-3xl text-[#FF8C00] dark:text-orange-400" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-gray-100 dark:border-slate-700">
              <FaBriefcase className="text-5xl text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">You haven't been hired for any projects yet.</p>
              <Link to="/freelancer/profile" className="mt-4 inline-block text-[#FF8C00] dark:text-orange-400 hover:underline">
                Complete your profile →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <div key={project.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{project.title}</h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><FaUser className="dark:text-gray-500" /> {project.employerName}</span>
                        <span className="flex items-center gap-1"><FaMoneyBillWave className="dark:text-gray-500" /> TZS {project.budget?.toLocaleString()}</span>
                        {project.deadline && (
                          <span className="flex items-center gap-1"><FaCalendarAlt className="dark:text-gray-500" /> Due: {formatDate(project.deadline)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/project/${project.id}/work`}
                        className="px-4 py-2 text-sm bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors flex items-center gap-1"
                      >
                        <FaUpload /> Submit Work
                      </Link>
                      <Link
                        to={`/project/${project.id}`}
                        className="px-4 py-2 text-sm text-[#FF8C00] dark:text-orange-400 border border-[#FF8C00] dark:border-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyProjects;