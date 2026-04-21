import React from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PostJob from "./pages/PostJob";
import EmployerDashboard from "./pages/EmployerDashboard";
import Profile from "./pages/Profile";
import JobsPage from "./pages/JobsPage";
import MyApplications from "./pages/MyApplications";
import BottomNav from "./Components/BottomNav";
import JobApplicants from "./pages/JobApplicants";
import JobApplyPage from "./pages/JobApplyPage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import CookieConsent from "./Components/CookieConsent";
import FreelancerProfile from "./pages/FreelancerProfile";
import Freelancers from "./pages/Freelancers";
import FreelancerDetail from "./pages/FreelancerDetail";
import HireFreelancer from "./pages/HireFreelancer";
import MyHires from "./pages/MyHires";
import MyProjects from "./pages/MyProjects";
import Settings from "./pages/Settings";
import { ThemeProvider } from "./context/ThemeContext";
import VerifyEmail from "./pages/VerifyEmail";
import LandingPage from "./pages/LandingPage";

// Component to conditionally show BottomNav
const AppContent = () => {
  const location = useLocation();
  
  // Hide BottomNav on landing page (/) and auth pages
  const hideBottomNav = location.pathname === "/" || 
    location.pathname === "/login" || 
    location.pathname === "/register" ||
    location.pathname === "/verify-email";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/freelancers" element={<Freelancers />} />
        <Route path="/freelancer/:id" element={<FreelancerDetail />} />
        <Route path="/hire/:id" element={<HireFreelancer />} />
        <Route path="/my-hires" element={<MyHires />} />
        <Route path="/my-projects" element={<MyProjects />} />
        <Route path="/freelancer/profile" element={<FreelancerProfile />} />

        {/* Legal Routes */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        
        {/* Job Routes */}
        <Route path="/job/:jobId/apply" element={<JobApplyPage />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard/jobs/:jobId/applicants" element={<JobApplicants />} />
        
        {/* Main Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/dashboard" element={<EmployerDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/applications" element={<MyApplications />} />
      </Routes>
      
      {/* Bottom Navigation - Hidden on landing page and auth pages */}
      {!hideBottomNav && <BottomNav />}
      
      {/* Cookie Consent - Appears on EVERY page */}
      <CookieConsent />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;