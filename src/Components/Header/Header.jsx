import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { logout } from "../../services/authService";
import { 
  HiHome, 
  HiBriefcase, 
  HiUserGroup, 
  HiUser, 
  HiMenu, 
  HiX,
  HiLogout,
  HiPlusCircle,
  HiChartBar,
  HiUsers,
  HiChevronDown,
  HiUserCircle,
  HiCog,
  HiClipboardList,
  HiBriefcase as HiBriefcaseIcon
} from "react-icons/hi";
import logo from "../../assets/logo.png";

const Header = () => {
  const { user, userProfile, isEmployer, isJobSeeker } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  // Main navigation for all users (Desktop) - CLUBS REMOVED
  const mainNavLinks = [
    { href: "/", label: "Home", icon: HiHome },
    { href: "/jobs", label: "Jobs", icon: HiBriefcase },
    { href: "/freelancers", label: "Freelancers", icon: HiUsers },
  ];

  // Role-specific navigation for Desktop
  const roleNavLinks = [];

  if (user && isEmployer()) {
    roleNavLinks.push({ href: "/dashboard", label: "Dashboard", icon: HiChartBar });
    roleNavLinks.push({ href: "/post-job", label: "Post Job", icon: HiPlusCircle });
    roleNavLinks.push({ href: "/my-hires", label: "My Hires", icon: HiBriefcaseIcon });
  }

  if (user && isJobSeeker()) {
    roleNavLinks.push({ href: "/freelancer/profile", label: "Freelancer Profile", icon: HiUser });
    roleNavLinks.push({ href: "/my-projects", label: "My Projects", icon: HiBriefcaseIcon });
  }

  const desktopNavLinks = [...mainNavLinks, ...roleNavLinks];

  // Dropdown menu items
  const dropdownItems = [
    { href: "/profile", label: "My Profile", icon: HiUserCircle },
    { href: isJobSeeker() ? "/applications" : "/dashboard", label: isJobSeeker() ? "My Applications" : "Dashboard", icon: HiClipboardList },
    { href: "/settings", label: "Settings", icon: HiCog },
  ];

  // Mobile navigation - CLUBS REMOVED
  const mobileNavLinks = [
    { href: "/", label: "Home", icon: HiHome },
    { href: "/jobs", label: "Jobs", icon: HiBriefcase },
    { href: "/freelancers", label: "Freelancers", icon: HiUsers },
  ];

  if (user && isEmployer()) {
    mobileNavLinks.push({ href: "/dashboard", label: "Dashboard", icon: HiChartBar });
    mobileNavLinks.push({ href: "/post-job", label: "Post Job", icon: HiPlusCircle });
    mobileNavLinks.push({ href: "/my-hires", label: "My Hires", icon: HiBriefcaseIcon });
  }

  if (user && isJobSeeker()) {
    mobileNavLinks.push({ href: "/applications", label: "My Applications", icon: HiUserGroup });
    mobileNavLinks.push({ href: "/freelancer/profile", label: "Freelancer Profile", icon: HiUser });
    mobileNavLinks.push({ href: "/my-projects", label: "My Projects", icon: HiBriefcaseIcon });
    mobileNavLinks.push({ href: "/profile", label: "My Profile", icon: HiUserCircle });
  }

  // ADD SETTINGS TO MOBILE MENU
  if (user) {
    mobileNavLinks.push({ href: "/settings", label: "Settings", icon: HiCog });
  }

  if (user && !isEmployer() && !isJobSeeker()) {
    mobileNavLinks.push({ href: "/profile", label: "My Profile", icon: HiUserCircle });
  }

  const displayName = userProfile?.companyName || user?.displayName || user?.email?.split('@')[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();
  const userRole = isEmployer() ? "Employer" : "Job Seeker";
  const profilePhoto = userProfile?.profilePicture || user?.photoURL;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-slate-700"
          : "bg-white dark:bg-slate-800 shadow-sm border-b border-gray-100 dark:border-slate-700"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src={logo} 
              alt="AjiraBora" 
              className="h-24 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {desktopNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#FF8C00] hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-all duration-200"
                >
                  <Icon className="text-lg" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth Section - Desktop with Dropdown */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition-all duration-200"
                >
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt={displayName} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[#FF8C00] rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {userInitial}
                      </span>
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white max-w-[150px] truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{userRole}</p>
                  </div>
                  <HiChevronDown className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        {profilePhoto ? (
                          <img 
                            src={profilePhoto} 
                            alt={displayName} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#FF8C00] rounded-full flex items-center justify-center">
                            <span className="text-base font-semibold text-white">
                              {userInitial}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    {dropdownItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-[#FF8C00] transition-colors"
                        >
                          <Icon className="text-lg" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                    <div className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <HiLogout className="text-lg" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#FF8C00] hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-[#1A2A4A] text-white rounded-lg hover:bg-[#243b66] transition-all shadow-sm"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-[#FF8C00] hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-all"
          >
            {isMenuOpen ? <HiX className="text-2xl" /> : <HiMenu className="text-2xl" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 dark:border-slate-700 max-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 mb-2">
              <img src={logo} alt="AjiraBora" className="h-10 w-auto object-contain" />
            </div>
            
            <div className="space-y-1">
              {mobileNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-[#FF8C00] hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-all"
                  >
                    <Icon className="text-xl" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
              
              {user ? (
                <>
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 mt-2">
                    <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt={displayName} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#FF8C00] rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{userInitial}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                  >
                    <HiLogout className="text-xl" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                  >
                    <span className="font-medium">Login</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1A2A4A] text-white rounded-lg hover:bg-[#243b66] transition-all"
                  >
                    <span className="font-medium">Sign Up Free</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;