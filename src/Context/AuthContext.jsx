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
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check email verification status
        const emailVerified = firebaseUser.emailVerified;
        setIsEmailVerified(emailVerified);
        
        // Only fetch profile if email is verified OR we need it for other purposes
        if (emailVerified) {
          try {
            const profile = await getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        } else {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        setIsEmailVerified(false);
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

  // Check if user can access protected routes (verified + has profile)
  const canAccessApp = () => {
    return user && user.emailVerified;
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
      setUser,
      userProfile, 
      loading,
      isEmailVerified,
      canAccessApp,
      updateUserDisplayName,
      isEmployer,
      isJobSeeker,
      getCompanyInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
};