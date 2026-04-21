import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BiCookie, BiCheck, BiX } from "react-icons/bi";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookieConsent");
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setShowBanner(false);
    // Here you can enable analytics, tracking, etc.
    console.log("Cookies accepted - enable tracking");
  };

  const rejectCookies = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setShowBanner(false);
    // Here you can disable analytics, tracking, etc.
    console.log("Cookies rejected - disable tracking");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1A2A4A] text-white rounded-xl shadow-xl p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <BiCookie className="text-[#FF8C00] text-2xl flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg mb-1">🍪 We Value Your Privacy</h3>
                <p className="text-sm text-gray-200">
                  We use cookies to enhance your browsing experience, serve personalized content, 
                  and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
                </p>
                <div className="flex gap-4 mt-2 text-xs">
                  <Link to="/cookies" className="text-[#FF8C00] hover:underline">
                    Cookie Policy
                  </Link>
                  <Link to="/privacy" className="text-[#FF8C00] hover:underline">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={rejectCookies}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <BiX className="text-lg" />
                Reject
              </button>
              <button
                onClick={acceptCookies}
                className="px-4 py-2 bg-[#FF8C00] text-[#1A2A4A] rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <BiCheck className="text-lg" />
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;