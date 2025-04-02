import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("published");
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editPostModal, setEditPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [postFormData, setPostFormData] = useState({ title: "", content: "", published: false, imageUrl: "" });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  
  // Image related states for post editing
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPatience, setShowPatience] = useState(false);
  
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
        const res = await fetch("https://backend.monilmeh.workers.dev/api/v1/user/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }
        
        const data = await res.json();
        setProfile(data);
        setFormData({ name: data.name, email: data.email });
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
  
  // Handle image change for post editing
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Upload image function
  const uploadImage = async () => {
    if (!image) return null;
    
    setImageUploading(true);
    setUploadProgress(10);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", image);
    
    try {
      // Show patience message after 3 seconds if still uploading
      const patienceTimer = setTimeout(() => setShowPatience(true), 3000);
      
      // Simulate progress for better UX
      let progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Increase slowly up to 90%
          if (prev < 90) return prev + Math.random() * 10;
          return prev;
        });
      }, 500);
      
      const res = await fetch("https://backend.monilmeh.workers.dev/api/v1/upload-image", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      clearTimeout(patienceTimer);
      clearInterval(progressInterval);
      setShowPatience(false);
      setUploadProgress(100);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload image");
      }
      
      const data = await res.json();
      return data.imageUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      throw err;
    } finally {
      setImageUploading(false);
    }
  };
  
  // Open edit post modal with post data
  const handleEditPost = async (post) => {
    try {
      // Reset image states when opening edit modal
      setImage(null);
      setImagePreview(null);
      
      // Fetch the full post data if needed
      const token = localStorage.getItem("token");
      const res = await fetch(`https://backend.monilmeh.workers.dev/api/v1/blog/${post.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch post details");
      }
      
      const postData = await res.json();
      setEditingPost(postData);
      setPostFormData({
        title: postData.title,
        content: postData.content || "",
        published: postData.published,
        imageUrl: postData.imageUrl || ""
      });
      
      // Set image preview if post has an image
      if (postData.imageUrl) {
        setImagePreview(postData.imageUrl);
      }
      
      setEditPostModal(true);
    } catch (err) {
      console.error("Error preparing post for edit:", err);
      alert("Failed to load post details. Please try again.");
    }
  };
  
  // Update post
  const handlePostUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    
    try {
      // Upload new image if selected
      let postImageUrl = postFormData.imageUrl;
      if (image) {
        try {
          postImageUrl = await uploadImage();
        } catch (err) {
          setUpdateError("Image upload failed: " + err.message);
          setUpdateLoading(false);
          return;
        }
      }
      
      const token = localStorage.getItem("token");
      const res = await fetch(`https://backend.monilmeh.workers.dev/api/v1/blog/${editingPost.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...postFormData,
          imageUrl: postImageUrl
        })
      });
      
      if (!res.ok) {
        throw new Error("Failed to update post");
      }
      
      const updatedPost = await res.json();
      
      // Update the profile state with updated post
      setProfile({
        ...profile,
        posts: profile.posts.map(post => 
          post.id === updatedPost.id ? {...post, ...updatedPost} : post
        )
      });
      
      setUpdateSuccess("Post updated successfully");
      setTimeout(() => {
        setEditPostModal(false);
        setUpdateSuccess(null);
        // Reset image states
        setImage(null);
        setImagePreview(null);
      }, 1500);
    } catch (err) {
      console.error("Error updating post:", err);
      setUpdateError("Failed to update post. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Delete a post
  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://backend.monilmeh.workers.dev/api/v1/blog/${postId}`, {
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
  
  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://backend.monilmeh.workers.dev/api/v1/user/update", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        throw new Error("Failed to update profile");
      }
      
      const updatedUser = await res.json();
      
      // Update the profile state with new data
      setProfile({
        ...profile,
        name: updatedUser.name,
        email: updatedUser.email
      });
      
      setUpdateSuccess("Profile updated successfully");
      setTimeout(() => {
        setEditProfileModal(false);
        setUpdateSuccess(null);
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      setUpdateError("Failed to update profile. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Edit Profile Modal Component
  const EditProfileModal = () => (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Edit Profile</h2>
        
        {updateError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
            {updateError}
          </div>
        )}
        
        {updateSuccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md">
            {updateSuccess}
          </div>
        )}
        
        <form onSubmit={handleProfileUpdate}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setEditProfileModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={updateLoading}
            >
              {updateLoading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
  
  // Edit Post Modal Component
  const EditPostModal = () => {
    if (!editingPost) return null;
    
    return (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Edit Post</h2>
          
          {updateError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
              {updateError}
            </div>
          )}
          
          {updateSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md">
              {updateSuccess}
            </div>
          )}
          
          <form onSubmit={handlePostUpdate}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                Title
              </label>
              <input
                type="text"
                value={postFormData.title}
                onChange={(e) => setPostFormData({...postFormData, title: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            {/* Cover Image Upload - Similar to NewPostPage */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cover Image
              </label>
              
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="post-cover-image"
                />
                
                <label 
                  htmlFor="post-cover-image"
                  className={`cursor-pointer flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all ${
                    imagePreview 
                    ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50" 
                    : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{imagePreview ? "Change Image" : "Select Cover Image"}</span>
                </label>
                
                {imageUploading && (
                  <div className="ml-4 flex-1 max-w-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Uploading...</span>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    
                    {/* Patience message */}
                    <AnimatePresence>
                      {showPatience && (
                        <motion.p 
                          className="text-xs italic text-gray-500 dark:text-gray-400 mt-1"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          Please be patient, image uploads may take some time...
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              
              {imagePreview && !imageUploading && (
                <motion.div 
                  className="mt-3 relative rounded-lg overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <img 
                    src={imagePreview} 
                    alt="Cover preview" 
                    className="h-48 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(postFormData.imageUrl || null);
                        if (!postFormData.imageUrl) {
                          setPostFormData({...postFormData, imageUrl: ""});
                        }
                      }}
                      className="opacity-0 hover:opacity-100 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg transform hover:scale-110 transition-all"
                    >
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
              
              {/* Option to remove existing image */}
              {postFormData.imageUrl && !image && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setPostFormData({...postFormData, imageUrl: ""});
                    }}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove image
                  </button>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                Content
              </label>
              <textarea
                value={postFormData.content}
                onChange={(e) => setPostFormData({...postFormData, content: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white min-h-[200px]"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={postFormData.published}
                  onChange={(e) => setPostFormData({...postFormData, published: e.target.checked})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Published</span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditPostModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={updateLoading || imageUploading}
              >
                {updateLoading ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-medium">
                {profile.name.charAt(0)}
              </div>
              <div className="ml-5">
                <h2 className="text-xl font-bold dark:text-white">{profile.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setEditProfileModal(true)}
                className="text-sm px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </button>
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
                  <button 
                    onClick={() => handleEditPost(post)}
                    className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
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
      
      {/* Modals */}
      <AnimatePresence>
        {editProfileModal && <EditProfileModal />}
        {editPostModal && <EditPostModal />}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfilePage;
