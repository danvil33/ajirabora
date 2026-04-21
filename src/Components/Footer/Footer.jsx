import React from "react";
import { Link } from "react-router-dom";
import {
  AiFillInstagram,
  AiFillFacebook,
  AiFillTwitterCircle,
} from "react-icons/ai";
import logo from "../../Assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-[#1A2A4A] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Column */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="AjiraBora" className="h-10 w-auto" />
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              AjiraBora connects job seekers with employers. Find your dream job or hire the best talent in Tanzania.
            </p>
            <div className="flex gap-3 mt-4">
              <AiFillInstagram className="bg-white/10 p-2 w-9 h-9 rounded-full text-gray-300 hover:bg-[#FF8C00] hover:text-white transition-all cursor-pointer" />
              <AiFillFacebook className="bg-white/10 p-2 w-9 h-9 rounded-full text-gray-300 hover:bg-[#FF8C00] hover:text-white transition-all cursor-pointer" />
              <AiFillTwitterCircle className="bg-white/10 p-2 w-9 h-9 rounded-full text-gray-300 hover:bg-[#FF8C00] hover:text-white transition-all cursor-pointer" />
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">About Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">Features</a></li>
              <li><a href="#" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">News</a></li>
              <li><a href="#" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">FAQ</a></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/applications" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">My Applications</Link></li>
              <li><Link to="/jobs" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">Browse Jobs</Link></li>
              <li><Link to="/profile" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">My Profile</Link></li>
              <li><a href="#" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">Support Center</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">Help Center</a></li>
              <li><a href="#" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">Contact Us</a></li>
              <li><Link to="/terms" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="text-gray-300 text-sm">Mwanza, Tanzania</li>
              <li className="text-gray-300 text-sm">+255 743 470 389</li>
              <li>
                <a href="mailto:info@ajirabora.com" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">
                  info@ajirabora.com
                </a>
              </li>
              <li>
                <a href="mailto:support@ajirabora.com" className="text-gray-300 hover:text-[#FF8C00] transition-colors text-sm">
                  support@ajirabora.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} AjiraBora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;