import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { db } from "../firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { 
  FaStar, 
  FaUser, 
  FaSpinner, 
  FaCheckCircle,
  FaBriefcase,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaShieldAlt,
  FaArrowLeft,
  FaRegHeart,
  FaShareAlt,
  FaFlag
} from "react-icons/fa";

const FreelancerDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [freelancer, setFreelancer] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("portfolio");

  useEffect(() => {
    fetchFreelancer();
    fetchPortfolio();
  }, [id]);

  const fetchFreelancer = async () => {
    try {
      const freelancerRef = doc(db, "freelancers", id);
      const freelancerSnap = await getDoc(freelancerRef);
      if (freelancerSnap.exists()) {
        setFreelancer({ id: freelancerSnap.id, ...freelancerSnap.data() });
      }
    } catch (error) {
      console.error("Error fetching freelancer:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const portfolioRef = collection(db, "freelancer_portfolio");
      const q = query(portfolioRef, where("freelancerId", "==", id));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPortfolio(items);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    }
  };

  const handleHire = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/hire/${id}`);
  };

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
          <FaSpinner className="animate-spin text-4xl text-[#FF8C00]" />
        </div>
        <Footer />
      </>
    );
  }

  if (!freelancer) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-32 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Freelancer not found</h1>
          <Link to="/freelancers" className="text-[#FF8C00] hover:underline mt-4 inline-block">Back to freelancers</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          
          {/* Back Button */}
          <button
            onClick={() => navigate("/freelancers")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF8C00] mb-6 transition-colors text-sm"
          >
            <FaArrowLeft /> Back to search results
          </button>

          {/* Profile Header - Upwork Style */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#FF8C00] to-orange-500">
                    {freelancer.photo ? (
                      <img src={freelancer.photo} alt={freelancer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">{getInitials(freelancer.name)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{freelancer.name}</h1>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full flex items-center gap-1">
                          <FaCheckCircle className="text-[10px]" /> Verified
                        </span>
                        {freelancer.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <FaStar className="text-amber-500 text-sm" />
                            <span className="text-sm font-medium">{freelancer.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Hire Button */}
                    <button
                      onClick={handleHire}
                      disabled={user?.uid === id}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        user?.uid === id
                          ? "bg-gray-200 cursor-not-allowed text-gray-500"
                          : "bg-[#FF8C00] hover:bg-orange-600 text-white"
                      }`}
                    >
                      {user?.uid === id ? "Cannot hire yourself" : "Hire Now"}
                    </button>
                  </div>
                  
                  {/* Bio */}
                  {freelancer.bio && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                      {freelancer.bio}
                    </p>
                  )}
                  
                  {/* Skills */}
                  {freelancer.skills && freelancer.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {freelancer.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Portfolio & About */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Portfolio Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio</h2>
                </div>
                <div className="p-6">
                  {portfolio.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No portfolio items yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {portfolio.map(item => (
                        <div key={item.id} className="border border-gray-100 dark:border-slate-700 rounded-lg overflow-hidden">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                          <div className="p-3">
                            <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                            )}
                            {item.link && (
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#FF8C00] hover:underline mt-2 inline-block">
                                View Project →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* About Section - Only show if has content */}
              {(freelancer.experience || freelancer.education) && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {freelancer.experience && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Work Experience</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{freelancer.experience}</p>
                      </div>
                    )}
                    {freelancer.education && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Education</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{freelancer.education}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              
              {/* Rates Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden sticky top-24">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rates</h2>
                </div>
                <div className="p-6 space-y-4">
                  {freelancer.hourlyRate > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Hourly Rate</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        TZS {freelancer.hourlyRate.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {freelancer.projectRate > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Project Rate</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        TZS {freelancer.projectRate.toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                    <button
                      onClick={handleHire}
                      disabled={user?.uid === id}
                      className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                        user?.uid === id
                          ? "bg-gray-200 cursor-not-allowed text-gray-500"
                          : "bg-[#FF8C00] hover:bg-orange-600 text-white"
                      }`}
                    >
                      {user?.uid === id ? "Cannot hire yourself" : "Send Message"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Info</h2>
                </div>
                <div className="p-6 space-y-3 text-sm">
                  {freelancer.location && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <FaMapMarkerAlt className="text-gray-400 text-sm" />
                      <span>{freelancer.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FaCalendarAlt className="text-gray-400 text-sm" />
                    <span>Member since {freelancer.createdAt ? new Date(freelancer.createdAt).getFullYear() : "2024"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FaShieldAlt className="text-gray-400 text-sm" />
                    <span>Identity verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FreelancerDetail;