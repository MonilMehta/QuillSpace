import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

const NewPostPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8787/api/v1/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          published: isPublished
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create post");
      }
      
      const post = await res.json();
      navigate(`/post/${post.id}`);
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err.message || "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div 
      className="max-w-4xl mx-auto px-4 py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-center mb-8">
        <motion.div 
          className="flex items-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.462 0c1.02 0 2.414 1.384 3.015 2.236C11.52 5.32 13.097 8.986 15 12.5c-1.003-1.765-2.847-4.174-3.757-5.207-.302 1.615-1.147 5.093-4.304 7.707 1.812-5.211.948-11.376-1.813-15h1.336zm3.71 21c-2.198 0-4.33-1.15-5.516-2.996a.664.664 0 0 1 .536-1.04h4.98c.222 0 .417.15.487.366C11.114 19.373 10.636 21 10.172 21z" />
          </svg>
          <span className="font-serif text-2xl font-bold text-black ml-2">Create a new story</span>
        </motion.div>
      </div>
      
      {error && (
        <motion.div 
          className="mb-6 p-4 bg-red-50 text-red-700 rounded-md"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="title" className="sr-only">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-0 py-3 text-3xl font-serif font-bold border-0 border-b border-gray-200 focus:outline-none focus:ring-0 focus:border-green-500"
            required
          />
        </div>
        
        <div className="mb-8">
          <label htmlFor="content" className="sr-only">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell your story..."
            className="w-full px-0 py-3 text-lg min-h-[400px] border-0 focus:outline-none focus:ring-0"
            required
          />
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="flex items-center">
            <input
              id="publish"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="publish" className="ml-2 text-sm text-gray-700">
              Publish immediately
            </label>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <motion.button
              type="submit"
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
              disabled={loading || !title || !content}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                  Publishing...
                </div>
              ) : "Publish"}
            </motion.button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default NewPostPage;
