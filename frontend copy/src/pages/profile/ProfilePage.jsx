import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("published");
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://127.0.0.1:8787/api/v1/user/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }
        
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Could not load your profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);
  
  // Delete a post
  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8787/api/v1/blog/${postId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete post");
      }
      
      // Update profile by removing the deleted post
      setProfile({
        ...profile,
        posts: profile.posts.filter(post => post.id !== postId)
      });
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post. Please try again.");
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-medium text-red-600 mb-3">Error</h2>
          <p className="text-gray-700">{error || "Could not load profile"}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 inline-block px-5 py-2 bg-black text-white rounded-full"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const publishedPosts = profile.posts.filter(post => post.published);
  const draftPosts = profile.posts.filter(post => !post.published);
  const displayedPosts = activeTab === "published" ? publishedPosts : draftPosts;
  
  return (
    <motion.div 
      className="max-w-4xl mx-auto px-4 py-6 dark:bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Profile Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <motion.h1 
            className="font-serif text-3xl md:text-4xl font-bold dark:text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Your Profile
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link 
              to="/new-post" 
              className="px-5 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 inline-flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Write a story
            </Link>
          </motion.div>
        </div>
        
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-medium">
              {profile.name.charAt(0)}
            </div>
            <div className="ml-5">
              <h2 className="text-xl font-bold dark:text-white">{profile.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Content Tabs */}
      <motion.div 
        className="mb-6 border-b border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex space-x-8">
          <button
            className={`pb-4 px-1 font-medium ${
              activeTab === "published"
                ? "border-b-2 border-green-600 text-green-600 dark:text-green-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("published")}
          >
            Published Stories ({publishedPosts.length})
          </button>
          <button
            className={`pb-4 px-1 font-medium ${
              activeTab === "drafts"
                ? "border-b-2 border-green-600 text-green-600 dark:text-green-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("drafts")}
          >
            Drafts ({draftPosts.length})
          </button>
        </div>
      </motion.div>
      
      {/* Posts List */}
      <div className="space-y-6">
        {displayedPosts.length === 0 ? (
          <motion.div 
            className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {activeTab === "published" 
                ? "You haven't published any stories yet." 
                : "You don't have any draft stories."}
            </p>
            <Link
              to="/new-post"
              className="inline-flex items-center text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Write a story
            </Link>
          </motion.div>
        ) : (
          displayedPosts.map((post, index) => (
            <motion.div 
              key={post.id} 
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + (index * 0.1) }}
            >
              <Link to={`/post/${post.id}`} className="block mb-1">
                <h3 className="font-serif text-xl font-bold hover:text-green-600 dark:text-white dark:hover:text-green-400 transition-colors">
                  {post.title}
                </h3>
              </Link>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    post.published ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
                  }`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                
                <div className="flex space-x-3">
                  <Link 
                    to={`/edit-post/${post.id}`}
                    className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default ProfilePage;
