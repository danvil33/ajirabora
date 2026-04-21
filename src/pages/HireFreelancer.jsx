import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { FaSpinner, FaCheckCircle, FaUser, FaMoneyBillWave, FaCalendarAlt, FaFileAlt, FaBriefcase, FaArrowLeft } from "react-icons/fa";

const HireFreelancer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: ""
  });

  useEffect(() => {
    fetchFreelancer();
  }, [id]);

  const fetchFreelancer = async () => {
    try {
      const freelancerRef = doc(db, "freelancers", id);
      const freelancerSnap = await getDoc(freelancerRef);
      if (freelancerSnap.exists()) {
        const freelancerData = { id: freelancerSnap.id, ...freelancerSnap.data() };
        
        // Check if trying to hire yourself
        if (user && freelancerData.userId === user.uid) {
          setError("You cannot hire yourself. Please hire other freelancers.");
          setFreelancer(freelancerData);
          setLoading(false);
          return;
        }
        
        setFreelancer(freelancerData);
      } else {
        setError("Freelancer not found");
      }
    } catch (error) {
      console.error("Error fetching freelancer:", error);
      setError("Failed to load freelancer profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Prevent self-hiring again in submit
    if (freelancer?.userId === user.uid) {
      setError("You cannot hire yourself. Please hire other freelancers.");
      return;
    }
    
    if (!formData.title || !formData.description || !formData.budget) {
      setError("Please fill in all required fields");
      return;
    }
    
    const minBudget = freelancer?.projectRate || 0;
    if (parseFloat(formData.budget) < minBudget) {
      setError(`Budget should be at least TZS ${minBudget.toLocaleString()}`);
      return;
    }
    
    setSubmitting(true);
    setError("");
    
    try {
      const projectData = {
        employerId: user.uid,
        freelancerId: id,
        title: formData.title,
        description: formData.description,
        budget: parseFloat(formData.budget),
        deadline: formData.deadline || null,
        status: "pending",
        createdAt: new Date().toISOString(),
        employerName: user.displayName || user.email?.split('@')[0],
        freelancerName: freelancer.name,
        employerEmail: user.email,
        freelancerEmail: freelancer.email
      };
      
      await addDoc(collection(db, "freelance_projects"), projectData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate("/my-hires");
      }, 2000);
    } catch (error) {
      console.error("Error creating project:", error);
      setError("Failed to create project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
          <FaSpinner className="animate-spin text-3xl text-[#FF8C00] dark:text-orange-400" />
        </div>
        <Footer />
      </>
    );
  }

  if (!freelancer) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm">
              <FaUser className="text-5xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Freelancer Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">The freelancer you're looking for doesn't exist or has been removed.</p>
              <Link to="/freelancers" className="inline-block bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white px-6 py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition">
                Browse Freelancers
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Show error message for self-hiring
  if (user && freelancer.userId === user.uid) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm">
              <FaUser className="text-5xl text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cannot Hire Yourself</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">You cannot send a hiring request to yourself. Please browse other talented freelancers.</p>
              <Link to="/freelancers" className="inline-block bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white px-6 py-2 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition">
                Browse Freelancers
              </Link>
            </div>
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
        <div className="max-w-3xl mx-auto px-4">
          <Link 
            to={`/freelancer/${id}`} 
            className="inline-flex items-center gap-2 text-[#FF8C00] dark:text-orange-400 hover:underline mb-4 transition"
          >
            <FaArrowLeft className="text-sm" /> Back to freelancer
          </Link>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-[#1A2A4A] to-[#243b66] dark:from-[#0f1a2e] dark:to-[#1a2a4a] text-white">
              <h1 className="text-xl font-bold">Hire {freelancer?.name}</h1>
              <p className="text-sm opacity-90 mt-1">Fill in the project details to get started</p>
            </div>
            
            <div className="p-6">
              {success && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-2">
                  <FaCheckCircle className="text-green-600 dark:text-green-400" /> Project invitation sent! Redirecting...
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {/* Freelancer Summary Card */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <FaBriefcase className="text-[#FF8C00] dark:text-orange-400" />
                  Freelancer Summary
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{freelancer.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Project Rate</p>
                    <p className="font-medium text-gray-900 dark:text-white">TZS {freelancer.projectRate?.toLocaleString() || 0}</p>
                  </div>
                  {freelancer.skills && freelancer.skills.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-gray-500 dark:text-gray-400">Skills</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {freelancer.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-slate-600 rounded-full text-gray-700 dark:text-gray-300">
                            {skill}
                          </span>
                        ))}
                        {freelancer.skills.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">+{freelancer.skills.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Title <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400 transition"
                    placeholder="e.g., Build E-commerce Website"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Description <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400 transition"
                    placeholder="Describe your project requirements, deliverables, and expectations..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Be specific about what you need, timeline, and any special requirements.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Budget (TZS) <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="number"
                      required
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400 transition"
                      placeholder={`${freelancer?.projectRate?.toLocaleString() || 0}`}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Minimum suggested: TZS {freelancer?.projectRate?.toLocaleString()}
                    </p>
                    {parseFloat(formData.budget) > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        ~ ${Math.round(parseFloat(formData.budget) / 2500)} USD
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:focus:ring-orange-400 transition"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When would you like the project to be completed?
                  </p>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#1A2A4A] dark:bg-[#0f1a2e] text-white py-3 rounded-lg hover:bg-[#243b66] dark:hover:bg-[#1a2a4a] transition-colors disabled:opacity-50 font-medium"
                  >
                    {submitting ? <FaSpinner className="animate-spin mx-auto" /> : "Send Hiring Request"}
                  </button>
                </div>
                
                <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
                  <FaFileAlt className="inline mr-1" /> By sending a request, you agree to our terms and conditions
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HireFreelancer;