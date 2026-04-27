import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import Footer from "../Components/Footer/Footer";
import logo from "../Assets/logo.png";
import img1 from "../Assets/img1.jpeg";
import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { 
  FaSearch, 
  FaMapMarkerAlt, 
  FaBriefcase, 
  FaBuilding, 
  FaStar, 
  FaBars,
  FaTimes,
  FaRegFileAlt,
  FaChartLine,
  FaChevronRight,
  FaRegHeart,
  FaBell,
  FaUserCircle,
  FaClock,
  FaSignOutAlt,
  FaUser,
  FaCog,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt as FaMapPin
} from "react-icons/fa";

const LandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchJob, setSearchJob] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [recentJobs, setRecentJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/home");
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user, navigate]);

  // Fetch real jobs from Firebase
  useEffect(() => {
    const fetchRecentJobs = async () => {
      try {
        const jobsRef = collection(db, "jobs");
        const jobsQuery = query(jobsRef, orderBy("postedAt", "desc"), limit(6));
        const jobsSnapshot = await getDocs(jobsQuery);
        
        const jobsList = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentJobs(jobsList);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchRecentJobs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchJob || searchLocation) {
      navigate(`/jobs?q=${encodeURIComponent(searchJob)}&l=${encodeURIComponent(searchLocation)}`);
    } else {
      navigate("/jobs");
    }
  };

  const formatTimePosted = (postedAt) => {
    if (!postedAt) return "Recently";
    const date = postedAt.toDate ? postedAt.toDate() : new Date(postedAt);
    const diffHours = Math.floor((new Date() - date) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffHours < 48) return "Yesterday";
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const popularSearches = ["Software Engineer", "Accountant", "Driver", "Sales", "Teacher", "Nurse"];

  return (
    <>
      {/* MOBILE VIEW */}
      <div className="md:hidden bg-white min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className={`fixed top-0 left-0 right-0 z-50 bg-[#1A2A4A] ${scrolled ? "shadow-sm" : ""}`}>
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="AjiraBora" className="h-12 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <FaBell className="text-white text-xl" />
              <Link to={user ? "/profile" : "/login"}>
                <FaUserCircle className="text-white text-2xl" />
              </Link>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <FaTimes size={22} className="text-white" /> : <FaBars size={22} className="text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed top-14 left-0 right-0 bg-[#1A2A4A] shadow-lg z-40 px-4 py-4">
            <div className="flex flex-col space-y-4">
              <Link to="/jobs" className="text-white py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>Find Jobs</Link>
              <Link to="/post-job" className="text-white py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>Post a Job</Link>
              <Link to="/companies" className="text-white py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>Companies</Link>
              <div className="pt-3 border-t border-white/20">
                {user ? (
                  <>
                    <Link to="/profile" className="block text-white py-2" onClick={() => setMobileMenuOpen(false)}>My Profile</Link>
                    <Link to="/applications" className="block text-white py-2" onClick={() => setMobileMenuOpen(false)}>My Applications</Link>
                    <button onClick={handleLogout} className="block text-white py-2 w-full text-left">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="block bg-[#FF8C00] text-white text-center py-3 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                    <Link to="/login" className="block text-center text-white py-3 mt-2" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="h-14"></div>

        {/* Hero Section - Mobile */}
        <div className="relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${img1})` }}>
          <div className="absolute inset-0 bg-black/55"></div>
          <div className="relative z-10 px-4 py-8">
            <h1 className="text-2xl font-bold text-white text-center mb-2">Find Jobs</h1>
            <p className="text-gray-200 text-center text-sm mb-6">Search thousands of jobs from top companies</p>
            
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="bg-white rounded-lg flex items-center px-4 py-3">
                <FaSearch className="text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  className="flex-1 outline-none text-sm text-gray-700"
                  value={searchJob}
                  onChange={(e) => setSearchJob(e.target.value)}
                />
              </div>
              <div className="bg-white rounded-lg flex items-center px-4 py-3">
                <FaMapMarkerAlt className="text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="City or region"
                  className="flex-1 outline-none text-sm text-gray-700"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-[#FF8C00] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition">
                Find Jobs
              </button>
            </form>
          </div>
        </div>

        {/* Popular Searches */}
        <div className="px-4 py-4 border-b bg-white">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Popular Searches</p>
            <Link to="/jobs" className="text-xs text-[#FF8C00]">See all</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchJob(term);
                  navigate(`/jobs?q=${encodeURIComponent(term)}`);
                }}
                className="bg-gray-100 px-3 py-1.5 rounded-full text-xs text-gray-700 hover:bg-gray-200"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="px-4 py-4 flex-1">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-gray-900">Recent Jobs</h2>
            <Link to="/jobs" className="text-xs text-[#FF8C00] font-medium">View all <FaChevronRight className="inline text-xs" /></Link>
          </div>
          
          {loadingJobs ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="border rounded-lg p-3 bg-gray-50 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentJobs.length > 0 ? (
            <div className="space-y-3">
              {recentJobs.slice(0, 5).map((job) => (
                <Link key={job.id} to={`/job/${job.id}/apply`} className="block border rounded-lg p-3 bg-white hover:shadow transition">
                  <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                    <FaBuilding className="text-xs" />
                    <span>{job.company}</span>
                    {job.location && (
                      <>
                        <span>•</span>
                        <FaMapMarkerAlt className="text-xs" />
                        <span>{job.location}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <FaClock className="text-xs" />
                      <span>{formatTimePosted(job.postedAt)}</span>
                    </div>
                    {job.type && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{job.type}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FaBriefcase className="text-4xl text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No jobs posted yet</p>
              <Link to="/post-job" className="text-[#FF8C00] text-sm mt-2 inline-block">Post a job →</Link>
            </div>
          )}
        </div>

        {/* Save Jobs Feature */}
        <div className="bg-[#1A2A4A] mx-4 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaRegHeart className="text-white text-xl" />
            <div>
              <h3 className="text-white font-semibold text-sm">Save Jobs</h3>
              <p className="text-gray-300 text-xs">Save jobs you're interested in</p>
            </div>
          </div>
          <Link to="/register" className="bg-[#FF8C00] text-white px-4 py-2 rounded-lg text-xs font-semibold">Sign up</Link>
        </div>

        {/* MOBILE FOOTER */}
        <div className="bg-[#1A2A4A] text-white mt-4">
          {/* Contact Info */}
          <div className="px-4 py-6 border-b border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <img src={logo} alt="AjiraBora" className="h-14 w-auto" />
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p className="flex items-center gap-2">
                <FaPhone className="text-[#FF8C00] text-sm" />
                <span>+255 743470389</span>
              </p>
              <p className="flex items-center gap-2">
                <FaEnvelope className="text-[#FF8C00] text-sm" />
                <span>support@ajiabora.com</span>
              </p>
              <p className="flex items-center gap-2">
                <FaMapPin className="text-[#FF8C00] text-sm" />
                <span>Dar es Salaam, Tanzania</span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="px-4 py-4 border-b border-white/20">
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link to="/jobs" className="text-gray-300 hover:text-[#FF8C00] transition">Find Jobs</Link>
              <Link to="/post-job" className="text-gray-300 hover:text-[#FF8C00] transition">Post a Job</Link>
              <Link to="/companies" className="text-gray-300 hover:text-[#FF8C00] transition">Companies</Link>
              <Link to="/about" className="text-gray-300 hover:text-[#FF8C00] transition">About Us</Link>
              <Link to="/contact" className="text-gray-300 hover:text-[#FF8C00] transition">Contact</Link>
              <Link to="/privacy" className="text-gray-300 hover:text-[#FF8C00] transition">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-300 hover:text-[#FF8C00] transition">Terms of Service</Link>
              <Link to="/cookies" className="text-gray-300 hover:text-[#FF8C00] transition">Cookie Policy</Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="px-4 py-4 border-b border-white/20">
            <h3 className="font-semibold text-white mb-3">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#FF8C00] transition">
                <FaFacebook className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#FF8C00] transition">
                <FaTwitter className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#FF8C00] transition">
                <FaLinkedin className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#FF8C00] transition">
                <FaInstagram className="text-white" />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="px-4 py-4 text-center text-gray-400 text-xs">
            <p>&copy; {new Date().getFullYear()} AjiraBora. All rights reserved.</p>
            <p className="mt-1">Empowering Tanzanian talent</p>
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="border-t pt-4 pb-8 bg-white">
          <div className="flex justify-around text-center text-xs text-gray-500">
            <Link to="/jobs" className="flex flex-col items-center gap-1 text-[#FF8C00]">
              <FaSearch className="text-lg" />
              <span>Find Jobs</span>
            </Link>
            <Link to="/post-job" className="flex flex-col items-center gap-1 text-gray-400">
              <FaBriefcase className="text-lg" />
              <span>Post Job</span>
            </Link>
            <Link to={user ? "/profile" : "/login"} className="flex flex-col items-center gap-1 text-gray-400">
              <FaUserCircle className="text-lg" />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW - unchanged from before */}
      <div className="hidden md:block min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="bg-[#1A2A4A] text-white text-sm py-2">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex gap-6">
              <span>📞 +255 743470389</span>
              <span>✉️ support@ajiabora.com</span>
            </div>
            <div className="flex gap-4">
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-2 hover:text-[#FF8C00] transition"
                  >
                    <FaUserCircle className="text-lg" />
                    <span>Account</span>
                  </button>
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                        <FaUser className="text-sm" /> My Profile
                      </Link>
                      <Link to="/applications" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                        <FaBriefcase className="text-sm" /> My Applications
                      </Link>
                      <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                        <FaCog className="text-sm" /> Settings
                      </Link>
                      <hr className="my-1" />
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 w-full text-left">
                        <FaSignOutAlt className="text-sm" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="hover:text-[#FF8C00] transition">Sign In</Link>
                  <span>|</span>
                  <Link to="/register" className="hover:text-[#FF8C00] transition">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <nav className={`bg-white border-b sticky top-0 z-50 ${scrolled ? "shadow-sm" : ""}`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="AjiraBora" className="h-16 w-auto object-contain" />
            </Link>
            <div className="flex gap-8">
              <Link to="/jobs" className="text-gray-700 hover:text-[#FF8C00] font-medium">Find Jobs</Link>
              <Link to="/post-job" className="text-gray-700 hover:text-[#FF8C00] font-medium">Post a Job</Link>
              <Link to="/companies" className="text-gray-700 hover:text-[#FF8C00] font-medium">Companies</Link>
            </div>
            <Link to="/post-job" className="bg-[#FF8C00] text-white px-5 py-2 rounded-lg font-medium hover:bg-orange-600 transition">
              Post a Job
            </Link>
          </div>
        </nav>

        {/* Hero Section - Desktop */}
        <div className="relative bg-cover bg-center bg-no-repeat py-20" style={{ backgroundImage: `url(${img1})` }}>
          <div className="absolute inset-0 bg-black/55"></div>
          <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Find Jobs That Fit Your Life</h1>
            <p className="text-xl text-gray-200 mb-8">Search thousands of jobs from top companies</p>
            
            <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200">
                  <FaSearch className="text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    className="flex-1 outline-none text-gray-700"
                    value={searchJob}
                    onChange={(e) => setSearchJob(e.target.value)}
                  />
                </div>
                <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200">
                  <FaMapMarkerAlt className="text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="City, region, or 'remote'"
                    className="flex-1 outline-none text-gray-700"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                <button type="submit" className="bg-[#FF8C00] hover:bg-orange-600 px-8 py-3 font-semibold text-white transition">
                  Find Jobs
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-7lx mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How AjiraBora Works</h2>
            <p className="text-gray-500">Three simple steps to your next career move</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF8C00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="text-2xl text-[#FF8C00]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Search Jobs</h3>
              <p className="text-gray-500">Find jobs that match your skills and location</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF8C00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaRegFileAlt className="text-2xl text-[#FF8C00]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Apply Online</h3>
              <p className="text-gray-500">Submit applications with just a few clicks</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF8C00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBriefcase className="text-2xl text-[#FF8C00]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Get Hired</h3>
              <p className="text-gray-500">Connect with employers and land your dream job</p>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-gray-500 text-sm uppercase tracking-wide mb-6">Trusted by job seekers from top companies</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <span className="text-gray-400 font-bold text-xl">CRDB BANK</span>
              <span className="text-gray-400 font-bold text-xl">NMB</span>
              <span className="text-gray-400 font-bold text-xl">VODACOM</span>
              <span className="text-gray-400 font-bold text-xl">TIGO</span>
              <span className="text-gray-400 font-bold text-xl">AIRTEL</span>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">What Our Users Say</h2>
              <p className="text-gray-500">Real stories from job seekers and employers</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <FaStar key={i} className="text-yellow-400 text-sm" />)}
                </div>
                <p className="text-gray-600 text-sm mb-4">"AjiraBora helped me find my dream job in just two weeks. The AI matching is incredibly accurate!"</p>
                <div className="font-semibold text-gray-800">John Mwakibete</div>
                <div className="text-xs text-gray-400">Software Engineer</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <FaStar key={i} className="text-yellow-400 text-sm" />)}
                </div>
                <p className="text-gray-600 text-sm mb-4">"As an employer, we found qualified candidates quickly. The platform is easy to use."</p>
                <div className="font-semibold text-gray-800">Sarah Mushi</div>
                <div className="text-xs text-gray-400">HR Manager, TechNova</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <FaStar key={i} className="text-yellow-400 text-sm" />)}
                </div>
                <p className="text-gray-600 text-sm mb-4">"The AI analyzed my skills perfectly and recommended jobs I would have never found myself."</p>
                <div className="font-semibold text-gray-800">Amina Juma</div>
                <div className="text-xs text-gray-400">Marketing Specialist</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#1A2A4A] py-12">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to Find Your Next Job?</h2>
            <p className="text-gray-300 mb-6">Join thousands of job seekers and start your journey today</p>
            <Link to="/register" className="inline-block bg-[#FF8C00] text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition">
              Create Free Account
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default LandingPage;