import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  HiHome, 
  HiBriefcase, 
  HiUserGroup, 
  HiUser,
  HiDocumentText,
  HiOutlineHome,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineDocumentText
} from "react-icons/hi";

const BottomNav = () => {
  const { user, userProfile, isEmployer, isJobSeeker } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  let navItems = [
    {
      path: "/",
      label: "Home",
      icon: HiOutlineHome,
      activeIcon: HiHome
    },
    {
      path: "/jobs",
      label: "Jobs",
      icon: HiOutlineBriefcase,
      activeIcon: HiBriefcase
    }
  ];

  // Add role-specific navigation
  if (user && isEmployer()) {
    navItems.push({
      path: "/dashboard",
      label: "Dashboard",
      icon: HiOutlineUserGroup,
      activeIcon: HiUserGroup
    });
  }
  
  if (user && isJobSeeker()) {
    navItems.push({
      path: "/applications",
      label: "Applied",
      icon: HiOutlineDocumentText,
      activeIcon: HiDocumentText
    });
  }
  
  // Profile is for everyone
  navItems.push({
    path: "/profile",
    label: "Profile",
    icon: HiOutlineUser,
    activeIcon: HiUser
  });

  const isActive = (path) => {
    if (path === "/") {
      return currentPath === path;
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  return (
    <>
      <div className="h-16 md:hidden"></div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 md:hidden z-50">
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const IconComponent = active ? item.activeIcon : item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 relative"
              >
                <div className="relative">
                  <IconComponent 
                    className={`text-2xl transition-all duration-200 ${
                      active 
                        ? 'text-[#FF8C00]' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                  {active && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF8C00] rounded-full"></div>
                  )}
                </div>
                <span 
                  className={`text-xs mt-1 font-medium transition-all duration-200 ${
                    active 
                      ? 'text-[#FF8C00]' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BottomNav;