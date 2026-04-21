import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { db } from "../firebase/config";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, addDoc } from "firebase/firestore";
import { uploadProfilePicture, uploadPortfolioImage } from "../services/cloudinaryService";
import { useNavigate, Link } from "react-router-dom";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { 
  FaUser, 
  FaPhone, 
  FaMapPin, 
  FaEdit,
  FaCheckCircle,
  FaSpinner,
  FaCamera,
  FaTags,
  FaMoneyBillWave,
  FaGlobe,
  FaGithub,
  FaLinkedin,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaBriefcase,
  FaClock,
  FaCheck,
  FaPlus,
  FaTrash,
  FaImage,
  FaEye,
  FaThumbsUp,
  FaShieldAlt,
  FaAward,
  FaEnvelope
} from "react-icons/fa";

const FreelancerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [error, setError] = useState("");
  const [hasFreelancerProfile, setHasFreelancerProfile] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    rating: 0,
    responseTime: "24h",
    earnings: 0,
    jobSuccess: 95
  });
  
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: "",
    description: "",
    image: null,
    imagePreview: null,
    link: ""
  });
  
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
    skills: "",
    github: "",
    linkedin: "",
    website: "",
    availability: "available",
    hourlyRate: "",
    projectRate: "",
    englishLevel: "Fluent",
    responseRate: 100
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchFreelancerProfile();
    fetchPortfolio();
    fetchStats();
  }, [user]);

  const fetchFreelancerProfile = async () => {
    try {
      const freelancerRef = doc(db, "freelancers", user.uid);
      const freelancerSnap = await getDoc(freelancerRef);
      
      if (freelancerSnap.exists()) {
        setHasFreelancerProfile(true);
        const data = freelancerSnap.data();
        setProfileData({
          name: data.name || user.displayName || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.bio || "",
          skills: data.skills ? data.skills.join(', ') : "",
          github: data.github || "",
          linkedin: data.linkedin || "",
          website: data.website || "",
          availability: data.availability || "available",
          hourlyRate: data.hourlyRate || "",
          projectRate: data.projectRate || "",
          englishLevel: data.englishLevel || "Fluent",
          responseRate: data.responseRate || 100
        });
        setProfilePictureUrl(data.photo || "");
        setStats({
          totalProjects: data.totalProjects || 0,
          completedProjects: data.completedProjects || 0,
          rating: data.rating || 0,
          responseTime: data.responseTime || "24h",
          earnings: data.earnings || 0,
          jobSuccess: data.jobSuccess || 95
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const portfolioRef = collection(db, "freelancer_portfolio");
      const q = query(portfolioRef, where("freelancerId", "==", user.uid));
      const snapshot = await getDocs(q);
      const items = [];
      for (const docSnap of snapshot.docs) {
        items.push({ id: docSnap.id, ...docSnap.data() });
      }
      setPortfolioItems(items);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const projectsRef = collection(db, "freelance_projects");
      const q = query(projectsRef, where("freelancerId", "==", user.uid));
      const snapshot = await getDocs(q);
      const completed = snapshot.docs.filter(doc => doc.data().status === "completed").length;
      const totalEarnings = snapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().status === "completed" ? (doc.data().budget || 0) : 0);
      }, 0);
      
      setStats(prev => ({
        ...prev,
        totalProjects: snapshot.size,
        completedProjects: completed,
        earnings: totalEarnings
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const imageUrl = await uploadProfilePicture(file);
      setProfilePictureUrl(imageUrl);
      
      const freelancerRef = doc(db, "freelancers", user.uid);
      await setDoc(freelancerRef, { photo: imageUrl }, { merge: true });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setError(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePortfolioUpload = async () => {
    if (!newPortfolioItem.title || !newPortfolioItem.image) {
      setError("Please provide title and image for portfolio item");
      return;
    }

    if (portfolioItems.length >= 6) {
      setError("Maximum 6 portfolio items allowed");
      return;
    }

    setUploadingPortfolio(true);
    setError("");
    
    try {
      // Upload image to Cloudinary
      const imageUrl = await uploadPortfolioImage(newPortfolioItem.image);
      
      // Save to Firestore
      const portfolioRef = collection(db, "freelancer_portfolio");
      const docRef = await addDoc(portfolioRef, {
        freelancerId: user.uid,
        title: newPortfolioItem.title,
        description: newPortfolioItem.description || "",
        imageUrl: imageUrl,
        link: newPortfolioItem.link || "",
        createdAt: new Date().toISOString()
      });

      setPortfolioItems([...portfolioItems, {
        id: docRef.id,
        title: newPortfolioItem.title,
        description: newPortfolioItem.description,
        imageUrl: imageUrl,
        link: newPortfolioItem.link
      }]);

      setShowPortfolioModal(false);
      setNewPortfolioItem({ title: "", description: "", image: null, imagePreview: null, link: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error uploading portfolio:", error);
      setError("Failed to upload portfolio item: " + error.message);
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (itemId, imageUrl) => {
    if (!window.confirm("Delete this portfolio item?")) return;
    try {
      await deleteDoc(doc(db, "freelancer_portfolio", itemId));
      setPortfolioItems(portfolioItems.filter(item => item.id !== itemId));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      setError("Failed to delete portfolio item");
    }
  };

  const handleSave = async () => {
    if (!profileData.name) {
      setError("Please enter your name");
      return;
    }

    setSaving(true);
    setError("");
    
    try {
      const freelancerData = {
        name: profileData.name,
        email: user.email,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        skills: profileData.skills.split(',').map(s => s.trim()).filter(s => s),
        github: profileData.github,
        linkedin: profileData.linkedin,
        website: profileData.website,
        availability: profileData.availability,
        hourlyRate: parseFloat(profileData.hourlyRate) || 0,
        projectRate: parseFloat(profileData.projectRate) || 0,
        photo: profilePictureUrl,
        userId: user.uid,
        englishLevel: profileData.englishLevel,
        responseRate: profileData.responseRate,
        updatedAt: new Date().toISOString()
      };
      
      const freelancerRef = doc(db, "freelancers", user.uid);
      await setDoc(freelancerRef, freelancerData, { merge: true });
      
      setHasFreelancerProfile(true);
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-500 text-sm" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-500 text-sm" />);
    }
    while (stars.length < 5) {
      stars.push(<FaRegStar key={stars.length} className="text-gray-300 text-sm" />);
    }
    return stars;
  };

  if (!user) {
    return null;
  }

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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Profile Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Image */}
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-[#1A2A4A] to-[#243b66] shadow-md">
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaUser className="text-white text-3xl" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => document.getElementById('profileImage').click()}
                    className="absolute bottom-0 right-0 bg-[#FF8C00] text-white p-1.5 rounded-full shadow-md hover:bg-orange-600 transition-colors"
                  >
                    <FaCamera className="text-xs" />
                  </button>
                  <input id="profileImage" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.name}</h1>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {profileData.skills?.split(',').slice(0, 3).join(' • ') || 'Add your skills'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          {renderStars(stats.rating)}
                          <span className="text-sm font-semibold ml-1">{stats.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600">{stats.completedProjects} projects</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-green-600">${stats.earnings.toLocaleString()} earned</span>
                      </div>
                    </div>
                    {hasFreelancerProfile && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <FaEdit /> Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                  <p className="text-xs text-gray-500">Total Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.completedProjects}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{profileData.responseRate}%</p>
                  <p className="text-xs text-gray-500">Response Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.responseTime}</p>
                  <p className="text-xs text-gray-500">Avg Response</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#FF8C00]">${stats.earnings.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Earnings</p>
                </div>
              </div>
            </div>
          </div>

          {saved && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2">
              <FaCheckCircle /> Profile saved successfully!
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About Me</h2>
                </div>
                <div className="p-6">
                  {isEditing ? (
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                      placeholder="Tell clients about your experience, skills, and what you can offer..."
                    />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {profileData.bio || "No bio added yet."}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Skills</h2>
                </div>
                <div className="p-6">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.skills}
                      onChange={(e) => setProfileData({...profileData, skills: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                      placeholder="React, Python, UI/UX (comma separated)"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.split(',').map((skill, i) => (
                        skill.trim() && (
                          <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                            {skill.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio</h2>
                  {hasFreelancerProfile && (
                    <button
                      onClick={() => setShowPortfolioModal(true)}
                      className="text-sm text-[#FF8C00] hover:underline flex items-center gap-1"
                    >
                      <FaPlus /> Add Project ({portfolioItems.length}/6)
                    </button>
                  )}
                </div>
                <div className="p-6">
                  {portfolioItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FaImage className="text-4xl mx-auto mb-2 opacity-50" />
                      <p>No portfolio items yet. Add your work samples!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {portfolioItems.map(item => (
                        <div key={item.id} className="border border-gray-100 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover" />
                          <div className="p-3">
                            <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                            {item.link && (
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#FF8C00] hover:underline mt-2 inline-block">
                                View Project →
                              </a>
                            )}
                            {isEditing && (
                              <button
                                onClick={() => handleDeletePortfolio(item.id)}
                                className="mt-2 text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                              >
                                <FaTrash /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Rates Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden sticky top-24">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-[#1A2A4A] to-[#243b66] text-white">
                  <h2 className="text-lg font-semibold">My Services</h2>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 uppercase font-semibold">Hourly Rate</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={profileData.hourlyRate}
                        onChange={(e) => setProfileData({...profileData, hourlyRate: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                        placeholder="25000"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        TZS {parseInt(profileData.hourlyRate).toLocaleString() || 0}
                        <span className="text-sm font-normal text-gray-500">/hour</span>
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 uppercase font-semibold">Project Rate</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={profileData.projectRate}
                        onChange={(e) => setProfileData({...profileData, projectRate: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                        placeholder="500000"
                      />
                    ) : (
                      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        TZS {parseInt(profileData.projectRate).toLocaleString() || 0}
                        <span className="text-sm font-normal text-gray-500">/project</span>
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 uppercase font-semibold">Availability</label>
                    {isEditing ? (
                      <select
                        value={profileData.availability}
                        onChange={(e) => setProfileData({...profileData, availability: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                      >
                        <option value="available">✅ Available</option>
                        <option value="busy">⏳ Busy</option>
                        <option value="not_available">❌ Not Available</option>
                      </select>
                    ) : (
                      <div className="mt-1">
                        {profileData.availability === "available" && <span className="text-green-600">✅ Available</span>}
                        {profileData.availability === "busy" && <span className="text-yellow-600">⏳ Busy</span>}
                        {profileData.availability === "not_available" && <span className="text-red-600">❌ Not Available</span>}
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 uppercase font-semibold">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg"
                        placeholder="Dar es Salaam"
                      />
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300 mt-1">{profileData.location || "Not specified"}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Verified</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaCheckCircle className="text-green-500" />
                        <span>Email Verified</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaShieldAlt className="text-[#FF8C00]" />
                        <span>Payment Protected</span>
                      </div>
                      {stats.completedProjects > 5 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaAward className="text-yellow-500" />
                          <span>Rising Talent</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(isEditing || !hasFreelancerProfile) && (
                    <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-slate-700">
                      {hasFreelancerProfile && (
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-[#1A2A4A] text-white py-2 rounded-lg hover:bg-[#243b66] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : (hasFreelancerProfile ? 'Update Profile' : 'Create Profile')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Portfolio Item</h2>
            <input
              type="text"
              placeholder="Project Title *"
              value={newPortfolioItem.title}
              onChange={(e) => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg mb-3"
            />
            <textarea
              placeholder="Project Description"
              value={newPortfolioItem.description}
              onChange={(e) => setNewPortfolioItem({...newPortfolioItem, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg mb-3"
            />
            <input
              type="url"
              placeholder="Project Link (optional)"
              value={newPortfolioItem.link}
              onChange={(e) => setNewPortfolioItem({...newPortfolioItem, link: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg mb-3"
            />
            {newPortfolioItem.imagePreview && (
              <img src={newPortfolioItem.imagePreview} alt="Preview" className="h-32 w-auto mb-3 rounded-lg object-cover" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setNewPortfolioItem({
                    ...newPortfolioItem,
                    image: file,
                    imagePreview: URL.createObjectURL(file)
                  });
                }
              }}
              className="w-full mb-4"
            />
            <p className="text-xs text-gray-500 mb-4">Maximum 6 items. Images will be displayed on your profile.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPortfolioModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePortfolioUpload}
                disabled={uploadingPortfolio}
                className="flex-1 bg-[#FF8C00] text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {uploadingPortfolio ? <FaSpinner className="animate-spin" /> : "Add Portfolio"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default FreelancerProfile;