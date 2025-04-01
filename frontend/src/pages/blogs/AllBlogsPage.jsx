import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const AllBlogsPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    const fetchAllBlogs = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://127.0.0.1:8787/api/v1/blogs");
        
        if (!res.ok) {
          throw new Error("Failed to fetch blogs");
        }
        
        const data = await res.json();
        setBlogs(data);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError("Could not load blogs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllBlogs();
  }, []);
  
  // Filter blogs by search term
  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.author.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <motion.div 
      className="max-w-6xl mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="mb-10 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
          Discover great stories
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Find and read the best stories from talented writers on any topic.
        </p>
      </motion.div>
      
      {/* Search Bar */}
      <motion.div 
        className="max-w-2xl mx-auto mb-12 relative"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <input
          type="text"
          placeholder="Search by title, content, or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <div className="absolute top-0 right-0 h-full flex items-center pr-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-lg text-center max-w-2xl mx-auto">
          <h2 className="text-xl font-medium text-red-600 mb-3">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">No stories found</h3>
          <p className="text-gray-600 mb-8">
            {searchTerm ? "No stories match your search criteria." : "There are no stories available yet."}
          </p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")} 
              className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBlogs.map((blog, index) => (
            <motion.div 
              key={blog.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + (index % 6) * 0.1 }}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              <Link to={`/post/${blog.id}`} className="block h-full">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                      {blog.author.name.charAt(0)}
                    </div>
                    <span className="ml-2 text-sm font-medium">{blog.author.name}</span>
                  </div>
                  
                  <h3 className="font-serif text-xl font-bold mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {blog.content.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                  </p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>
                      {new Date(blog.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {blog.likes?.length || 0}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
      
      {!loading && !error && filteredBlogs.length > 0 && (
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="text-gray-500">You've viewed all available stories</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AllBlogsPage;
