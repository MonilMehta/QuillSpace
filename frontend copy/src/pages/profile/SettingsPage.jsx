import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeProvider";

const SettingsPage = () => {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [message, setMessage] = useState(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // In a real app, you would fetch the user's current email, etc.
    // Here we'll just use placeholder data
    setEmail("user@example.com");
  }, []);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      setMessage({ type: "success", text: "Password updated successfully" });
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
  };

  const handleSubscriptionChange = () => {
    setIsSubscribed(!isSubscribed);
    
    // Simulate API call
    setTimeout(() => {
      setMessage({ 
        type: "success", 
        text: !isSubscribed 
          ? "You have been subscribed to our newsletter" 
          : "You have been unsubscribed from our newsletter" 
      });
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 dark:bg-gray-900">
      <motion.h1 
        className="text-3xl font-bold mb-8 dark:text-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Settings
      </motion.h1>

      {message && (
        <motion.div 
          className={`p-4 mb-6 rounded-md ${
            message.type === "error" 
              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" 
              : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          }`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - Account Settings */}
        <div>
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Account Settings</h2>
            
            <form onSubmit={handlePasswordChange}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">Current Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Update Password
              </button>
            </form>
          </section>
        </div>
        
        {/* Right column - Preferences */}
        <div>
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Preferences</h2>
            
            {/* Theme Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 dark:text-white">Theme</h3>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setTheme("light")} 
                  className={`px-4 py-2 rounded-md border ${
                    theme === "light" 
                      ? "bg-green-100 border-green-600 dark:bg-green-900/50 dark:border-green-500 dark:text-green-400" 
                      : "bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  }`}
                >
                  Light
                </button>
                <button 
                  onClick={() => setTheme("dark")} 
                  className={`px-4 py-2 rounded-md border ${
                    theme === "dark" 
                      ? "bg-green-100 border-green-600 dark:bg-green-900/50 dark:border-green-500 dark:text-green-400" 
                      : "bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  }`}
                >
                  Dark
                </button>
                <button 
                  onClick={() => setTheme("system")} 
                  className={`px-4 py-2 rounded-md border ${
                    theme === "system" 
                      ? "bg-green-100 border-green-600 dark:bg-green-900/50 dark:border-green-500 dark:text-green-400" 
                      : "bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  }`}
                >
                  System
                </button>
              </div>
            </div>
            
            {/* Newsletter Subscription */}
            <div>
              <h3 className="text-lg font-medium mb-3 dark:text-white">Email Notifications</h3>
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  id="newsletter" 
                  checked={isSubscribed}
                  onChange={handleSubscriptionChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="newsletter" className="ml-2 block text-gray-700 dark:text-gray-300">
                  Subscribe to newsletter
                </label>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get updates about new features, blog posts, and other announcements.
              </p>
            </div>
          </section>
          
          {/* Connected Accounts Section */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Connected Accounts</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium dark:text-white">Facebook</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Not connected</p>
                  </div>
                </div>
                <button className="text-green-600 hover:text-green-800 dark:hover:text-green-400">
                  Connect
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium dark:text-white">GitHub</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Not connected</p>
                  </div>
                </div>
                <button className="text-green-600 hover:text-green-800 dark:hover:text-green-400">
                  Connect
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
