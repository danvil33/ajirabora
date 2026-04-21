import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { db } from "../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { 
  FaStar, 
  FaSearch, 
  FaUser, 
  FaSpinner, 
  FaCheckCircle,
  FaBriefcase,
  FaRegHeart,
  FaFilter,
  FaTimes,
  FaArrowRight
} from "react-icons/fa";
import { BiMapPin, BiTrendingUp, BiDollarCircle } from "react-icons/bi";

const Freelancers = () => {
  const { user } = useAuth();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);

  useEffect(() => {
    fetchFreelancers();
  }, []);

  useEffect(() => {
    if (freelancers.length > 0) {
      const allSkills = new Set();
      freelancers.forEach(f => {
        f.skills?.forEach(skill => allSkills.add(skill));
      });
      setAvailableSkills(Array.from(allSkills).slice(0, 10));
    }
  }, [freelancers]);

  const fetchFreelancers = async () => {
    try {
      const freelancersRef = collection(db, "freelancers");
      const snapshot = await getDocs(freelancersRef);
      let freelancersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out the current user (prevent self-hiring)
      if (user) {
        freelancersData = freelancersData.filter(f => f.id !== user.uid);
      }
      
      setFreelancers(freelancersData);
    } catch (error) {
      console.error("Error fetching freelancers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFreelancers = freelancers.filter(f => {
    const matchesSearch = f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSkill = !selectedSkill || f.skills?.includes(selectedSkill);
    return matchesSearch && matchesSkill;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSkill("");
  };

  const hasActiveFilters = searchTerm || selectedSkill;

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
      <Header />
      
      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Find <span className="text-[#FF8C00]">Top Freelancers</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Hire skilled professionals for your projects. Browse thousands of talented freelancers ready to help you succeed.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF8C00] to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
              <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xl" />
              <input
                type="text"
                placeholder="Search by name, skills, or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-32 py-4 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF8C00] bg-transparent text-gray-900 dark:text-white text-lg"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <FaFilter className="text-sm" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="max-w-3xl mx-auto mb-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filter by Skills</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => setSelectedSkill(selectedSkill === skill ? "" : skill)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedSkill === skill
                      ? "bg-[#FF8C00] text-white shadow-md"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                  <FaTimes /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{filteredFreelancers.length}</span> freelancers found
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-[#FF8C00] hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {/* Freelancers Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-slate-700 border-t-[#FF8C00]"></div>
            </div>
          </div>
        ) : filteredFreelancers.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
            <div className="w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUser className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No freelancers found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm ? "Try adjusting your search or filters" : "Be the first to create a freelancer profile!"}
            </p>
            {user && !searchTerm && (
              <Link
                to="/freelancer/profile"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF8C00] text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
              >
                Create Your Profile <FaArrowRight />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFreelancers.map((freelancer, index) => (
              <div
                key={freelancer.id}
                className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 hover:scale-[1.02]"
              >
                {/* Card Header */}
                <div className="relative h-28 bg-gradient-to-r from-[#1A2A4A] to-[#243b66]">
                  <div className="absolute -bottom-10 left-5">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 bg-white shadow-md">
                      {freelancer.photo ? (
                        <img src={freelancer.photo} alt={freelancer.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF8C00] to-orange-500">
                          <span className="text-white text-2xl font-bold">{getInitials(freelancer.name)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="pt-12 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-[#FF8C00] transition-colors">
                      {freelancer.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                      <FaStar className="text-amber-500 text-xs" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{freelancer.rating || "New"}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {freelancer.bio || "Professional freelancer ready to work on your projects"}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {freelancer.skills?.slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full">
                        {skill}
                      </span>
                    ))}
                    {freelancer.skills?.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-500 rounded-full">
                        +{freelancer.skills.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Rate */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
                    <div>
                      <span className="text-xl font-bold text-[#FF8C00]">
                        TZS {freelancer.projectRate?.toLocaleString() || "Contact"}
                      </span>
                      {freelancer.projectRate && <span className="text-xs text-gray-500">/project</span>}
                    </div>
                    <Link
                      to={`/freelancer/${freelancer.id}`}
                      className="px-4 py-2 bg-[#1A2A4A] text-white text-sm rounded-xl hover:bg-[#243b66] transition-colors font-medium"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Freelancers;