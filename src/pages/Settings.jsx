import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { useTheme } from "../Context/ThemeContext";
import { updateUserProfile } from "../services/userService";
import { updatePassword, updateEmail, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase/config";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { 
  FaUser, 
  FaBell, 
  FaLock, 
  FaEnvelope,
  FaMoon,
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaTrash
} from "react-icons/fa";

const Settings = () => {
  const { user, userProfile } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    jobAlerts: true,
    applicationUpdates: true,
    marketingEmails: false
  });
  
  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    showEmail: true,
    showPhone: true,
    profileVisibility: "public"
  });
  
  // Account Settings
  const [accountSettings, setAccountSettings] = useState({
    displayName: userProfile?.name || user?.displayName || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);

  useEffect(() => {
    const savedNotifications = localStorage.getItem("notificationSettings");
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    const savedPrivacy = localStorage.getItem("privacySettings");
    if (savedPrivacy) {
      setPrivacy(JSON.parse(savedPrivacy));
    }
  }, []);

  const handleNotificationChange = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem("notificationSettings", JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePrivacyChange = (key, value) => {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    localStorage.setItem("privacySettings", JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUpdateDisplayName = async () => {
    if (!accountSettings.displayName.trim()) {
      setError("Display name cannot be empty");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await updateUserProfile(user.uid, { name: accountSettings.displayName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!accountSettings.currentPassword || !accountSettings.newPassword) {
      setError("Please enter current and new password");
      return;
    }
    
    if (accountSettings.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    setUpdatingPassword(true);
    setError("");
    
    try {
      await updatePassword(auth.currentUser, accountSettings.newPassword);
      setSuccess("Password updated successfully!");
      setAccountSettings({
        ...accountSettings,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setError("Please re-login to change password");
      } else {
        setError(err.message);
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!accountSettings.email || accountSettings.email === user?.email) {
      setError("Please enter a new email address");
      return;
    }
    
    setUpdatingEmail(true);
    setError("");
    
    try {
      await updateEmail(auth.currentUser, accountSettings.email);
      await sendEmailVerification(auth.currentUser);
      setSuccess("Email updated! Please verify your new email address.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setError("Please re-login to change email");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already in use");
      } else {
        setError(err.message);
      }
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    
    const confirm = window.prompt("Type 'DELETE' to confirm account deletion:");
    if (confirm !== "DELETE") {
      return;
    }
    
    alert("Account deletion request sent. Please contact support.");
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your account preferences and privacy</p>

          {saved && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <FaCheckCircle /> Settings saved successfully!
            </div>
          )}
          
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <FaExclamationTriangle /> {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <FaCheckCircle /> {success}
            </div>
          )}

          <div className="space-y-6">
            {/* Appearance Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaMoon className="text-[#FF8C00]" /> Appearance
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:ring-offset-2"
                    style={{ backgroundColor: darkMode ? '#FF8C00' : '#cbd5e1' }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaBell className="text-[#FF8C00]" /> Notifications
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Email Alerts</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications</p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange("emailAlerts")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.emailAlerts ? 'bg-[#FF8C00]' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Job Alerts</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about new matching jobs</p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange("jobAlerts")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.jobAlerts ? 'bg-[#FF8C00]' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.jobAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Application Updates</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status changes on your applications</p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange("applicationUpdates")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.applicationUpdates ? 'bg-[#FF8C00]' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.applicationUpdates ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Marketing Emails</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tips, updates, and offers</p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange("marketingEmails")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.marketingEmails ? 'bg-[#FF8C00]' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.marketingEmails ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaLock className="text-[#FF8C00]" /> Privacy
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Profile Visibility</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Who can see your profile</p>
                  </div>
                  <select
                    value={privacy.profileVisibility}
                    onChange={(e) => handlePrivacyChange("profileVisibility", e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="connections">Connections Only</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Show Email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Display email on your profile</p>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange("showEmail", !privacy.showEmail)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacy.showEmail ? 'bg-[#FF8C00]' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy.showEmail ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Show Phone</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Display phone number on your profile</p>
                  </div>
                  <button
                    onClick={() => handlePrivacyChange("showPhone", !privacy.showPhone)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacy.showPhone ? 'bg-[#FF8C00]' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy.showPhone ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaUser className="text-[#FF8C00]" /> Account
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={accountSettings.displayName}
                      onChange={(e) => setAccountSettings({...accountSettings, displayName: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                    />
                    <button
                      onClick={handleUpdateDisplayName}
                      disabled={loading}
                      className="px-4 py-2 bg-[#1A2A4A] text-white rounded-lg hover:bg-[#243b66] disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                      Save
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={accountSettings.email}
                      onChange={(e) => setAccountSettings({...accountSettings, email: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                    />
                    <button
                      onClick={handleUpdateEmail}
                      disabled={updatingEmail}
                      className="px-4 py-2 bg-[#1A2A4A] text-white rounded-lg hover:bg-[#243b66] disabled:opacity-50 flex items-center gap-2"
                    >
                      {updatingEmail ? <FaSpinner className="animate-spin" /> : <FaSave />}
                      Update
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Changing email requires verification</p>
                </div>

                {/* Change Password */}
                <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Current Password"
                        value={accountSettings.currentPassword}
                        onChange={(e) => setAccountSettings({...accountSettings, currentPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New Password"
                        value={accountSettings.newPassword}
                        onChange={(e) => setAccountSettings({...accountSettings, newPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm New Password"
                        value={accountSettings.confirmPassword}
                        onChange={(e) => setAccountSettings({...accountSettings, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] dark:bg-slate-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <button
                      onClick={handleUpdatePassword}
                      disabled={updatingPassword}
                      className="px-4 py-2 bg-[#1A2A4A] text-white rounded-lg hover:bg-[#243b66] disabled:opacity-50"
                    >
                      {updatingPassword ? <FaSpinner className="animate-spin" /> : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-200 dark:border-red-800">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <FaExclamationTriangle /> Danger Zone
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                    <p className="text-sm text-red-500 dark:text-red-300">Permanently delete your account and all data</p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FaTrash /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Settings;