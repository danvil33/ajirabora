import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { getUserProfile } from "../services/userService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const updateUserDisplayName = async (displayName) => {
    if (user) {
      await updateProfile(user, { displayName });
      setUser({ ...user, displayName });
    }
  };

  // Role check helpers
  const isEmployer = () => {
    return userProfile?.role === "employer";
  };

  const isJobSeeker = () => {
    return userProfile?.role === "jobseeker";
  };

  // Get company info if employer
  const getCompanyInfo = () => {
    if (isEmployer()) {
      return {
        name: userProfile?.companyName,
        website: userProfile?.companyWebsite,
        phone: userProfile?.companyPhone,
        address: userProfile?.companyAddress,
        description: userProfile?.companyDescription
      };
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser,  // <-- ADD THIS LINE - very important!
      userProfile, 
      loading, 
      updateUserDisplayName,
      isEmployer,
      isJobSeeker,
      getCompanyInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
};