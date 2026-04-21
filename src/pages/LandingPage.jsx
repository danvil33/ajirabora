// src/pages/LandingPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../Components/Footer/Footer";
import logo from "../assets/logo.png";
import img1 from "../assets/img1.jpeg";
import img2 from "../assets/img2.jpeg";
import homeImg from "../assets/home.png";
import { 
  FaPhone, 
  FaEnvelope, 
  FaWhatsapp, 
  FaFacebook, 
  FaLinkedin, 
  FaTwitter, 
  FaInstagram, 
  FaTiktok, 
  FaYoutube,
  FaCheckCircle,
  FaTachometerAlt,
  FaEye,
  FaChartLine,
  FaBars
} from "react-icons/fa";

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/home");
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user, navigate]);

  useEffect(() => {
    const tags = document.querySelectorAll('.tag');
    tags.forEach((tag, i) => {
      tag.style.opacity = 0;
      setTimeout(() => {
        tag.style.transition = "all 0.6s ease";
        tag.style.opacity = 1;
        tag.style.transform = "translateY(-10px)";
      }, i * 200);
    });
  }, []);

  const handleStartNow = () => {
    navigate("/register");
  };

  return (
    <>
      {/* MOBILE VIEW (hidden on desktop) */}
      <div className="block md:hidden min-h-screen w-full">
        <div 
          className="relative min-h-screen w-full flex flex-col justify-end"
          style={{ 
            backgroundImage: `url(${homeImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* No overlay here */}
          
          <div className="relative z-10 px-6 pb-12">
            <button
              onClick={handleStartNow}
              className="w-full bg-[#FF8C00] hover:bg-orange-600 text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg text-base"
            >
              Get Start Now
            </button>
            
            <p className="text-center text-white text-xs mt-4">
              Already have an account?{" "}
              <button 
                onClick={() => navigate("/login")}
                className="text-[#FF8C00] font-semibold hover:underline"
              >
                 have an account? Sign In
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW (hidden on mobile) */}
      <div className="hidden md:block min-h-screen bg-gray-100 dark:bg-slate-900 flex flex-col">
        {/* TOP BAR */}
        <div className="bg-[#1A2A4A] text-white flex justify-between items-center px-4 md:px-10 py-2 text-xs md:text-sm flex-wrap gap-2">
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-2">
              <FaPhone className="text-[#FF8C00] text-xs" /> +255 743470389
            </span>
            <span className="flex items-center gap-2">
              <FaEnvelope className="text-[#FF8C00] text-xs" /> support@ajiabora.com
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <FaWhatsapp className="hover:text-[#FF8C00] cursor-pointer transition text-sm" />
            <FaFacebook className="hover:text-[#FF8C00] cursor-pointer transition text-sm" />
            <FaLinkedin className="hover:text-[#FF8C00] cursor-pointer transition text-sm" />
            <FaTwitter className="hover:text-[#FF8C00] cursor-pointer transition text-sm" />
            <FaInstagram className="hover:text-[#FF8C00] cursor-pointer transition text-sm" />
            <FaTiktok className="hover:text-[#FF8C00] cursor-pointer transition text-sm" />
            <FaYoutube className="hover:text-[#FF8C00] cursor-pointer transition text-sm" />
            <span className="ml-2">
              <Link to="/login" className="hover:text-[#FF8C00] transition">Login</Link> | <Link to="/register" className="hover:text-[#FF8C00] transition">Register</Link>
            </span>
          </div>
        </div>

        {/* NAVBAR */}
        <nav className={`flex justify-between items-center px-4 md:px-10 py-4 md:py-5 bg-white dark:bg-slate-800 transition-shadow ${
          scrolled ? "shadow-md" : ""
        }`}>
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="AjiraBora" 
              className="h-16 md:h-10 w-auto object-contain"
            />
          </Link>

          <div className="hidden md:flex gap-6 lg:gap-8">
            <Link to="/jobs" className="text-gray-700 dark:text-gray-200 hover:text-[#FF8C00] transition font-medium">Find Work</Link>
            <Link to="/post-job" className="text-gray-700 dark:text-gray-200 hover:text-[#FF8C00] transition font-medium">Post a Job</Link>
            <Link to="/freelancers" className="text-gray-700 dark:text-gray-200 hover:text-[#FF8C00] transition font-medium">Why AjiraBora</Link>
            <Link to="/clubs" className="text-gray-700 dark:text-gray-200 hover:text-[#FF8C00] transition font-medium">Resources</Link>
            <Link to="/contact" className="text-gray-700 dark:text-gray-200 hover:text-[#FF8C00] transition font-medium">Contact Us</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/register" className="hidden md:block px-5 py-2 border-2 border-[#FF8C00] rounded-lg text-[#FF8C00] font-semibold hover:bg-[#FF8C00] hover:text-white transition">
              Get Started Now
            </Link>
            <button 
              className="md:hidden text-gray-700 dark:text-gray-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <FaBars className="text-xl" />
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-800 px-4 py-4 flex flex-col gap-3 border-t border-gray-100 dark:border-slate-700">
            <Link to="/jobs" className="text-gray-700 dark:text-gray-200 py-2">Find Work</Link>
            <Link to="/post-job" className="text-gray-700 dark:text-gray-200 py-2">Post a Job</Link>
            <Link to="/freelancers" className="text-gray-700 dark:text-gray-200 py-2">Why AjiraBora</Link>
            <Link to="/clubs" className="text-gray-700 dark:text-gray-200 py-2">Resources</Link>
            <Link to="/contact" className="text-gray-700 dark:text-gray-200 py-2">Contact Us</Link>
            <Link to="/register" className="text-center px-5 py-2 border-2 border-[#FF8C00] rounded-lg text-[#FF8C00] font-semibold mt-2">Get Started Now</Link>
          </div>
        )}

        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between px-4 md:px-10 py-12 md:py-16 gap-10">
          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#FF8C00]/10 px-4 py-2 rounded-full mb-5">
              <span className="text-[#FF8C00] text-sm font-medium"> One-stop online talent management tool.</span>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
              Our platform empowers businesses to find and develop talent, and helps individuals advance their careers.
            </p>

            <div className="flex gap-4">
              <Link to="/register" className="bg-[#FF8C00] hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition shadow-md">
                Get Started
              </Link>
              <Link to="/jobs" className="bg-[#1A2A4A] hover:bg-[#2a3d6e] text-white px-8 py-3 rounded-lg font-semibold transition shadow-md">
                Learn More
              </Link>
            </div>
          </div>

          <div className="flex-1 relative flex justify-center">
            <div className="relative">
              <img 
                src={img1} 
                alt="Team collaboration"
                className="w-80 md:w-96 lg:w-[450px] rounded-full object-cover shadow-xl"
              />
              
              <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 lg:-bottom-8 lg:-right-8">
                <img 
                  src={img2} 
                  alt="Team work"
                  className="w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full object-cover shadow-lg border-4 border-white dark:border-slate-800"
                />
              </div>
            </div>

            <div className="tag absolute top-0 left-[-20px] md:left-[-60px] bg-white dark:bg-slate-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm">
              <FaCheckCircle className="text-[#FF8C00] text-sm" />
              <span className="text-gray-700 dark:text-gray-300">Access opportunities</span>
            </div>

            <div className="tag absolute top-5 right-[-20px] md:top-10 md:right-[-40px] bg-white dark:bg-slate-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm">
              <FaTachometerAlt className="text-[#FF8C00] text-sm" />
              <span className="text-gray-700 dark:text-gray-300">Hire faster</span>
            </div>

            <div className="tag absolute bottom-32 left-[-30px] md:bottom-36 md:left-[-50px] bg-white dark:bg-slate-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm">
              <FaEye className="text-[#FF8C00] text-sm" />
              <span className="text-gray-700 dark:text-gray-300">Visibility to employers</span>
            </div>

            <div className="tag absolute bottom-5 right-[-20px] md:bottom-10 md:right-[-60px] bg-white dark:bg-slate-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm">
              <FaChartLine className="text-[#FF8C00] text-sm" />
              <span className="text-gray-700 dark:text-gray-300">Upskill & track progress</span>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default LandingPage;