import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

const BlogPage = () => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  
  // Fetch blog post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8787/api/v1/blog/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch post");
        }
        const data = await res.json();
        setPost(data);
        
        // Check if user has liked this post
        if (isAuthenticated && data.likes && data.likes.some(like => like.id === user.id)) {
          setLiked(true);
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Could not load the blog post. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchComments = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8787/api/v1/blog/${id}/comments`);
        if (!res.ok) {
          throw new Error("Failed to fetch comments");
        }
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };
    
    fetchPost();
    fetchComments();
  }, [id, isAuthenticated, user]);
  
  // Handle adding a comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setCommentLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8787/api/v1/blog/${id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      
      if (!res.ok) {
        throw new Error("Failed to add comment");
      }
      
      const newCommentData = await res.json();
      // Add author info to the new comment
      newCommentData.author = {
        name: user.name,
        email: user.email
      };
      
      setComments([newCommentData, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add your comment. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };
  
  // Handle like/unlike
  const handleLike = async () => {
    if (!isAuthenticated) {
      alert("Please log in to like posts");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const endpoint = liked ? 
        `http://127.0.0.1:8787/api/v1/blog/${id}/unlike` : 
        `http://127.0.0.1:8787/api/v1/blog/${id}/like`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error("Failed to update like status");
      }
      
      setLiked(!liked);
    } catch (err) {
      console.error("Error updating like:", err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-medium text-red-600 mb-3">Error</h2>
          <p className="text-gray-700">{error || "Blog post not found"}</p>
          <Link 
            to="/" 
            className="mt-4 inline-block px-5 py-2 bg-black text-white rounded-full"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="max-w-4xl mx-auto px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Blog Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
          {post.title}
        </h1>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
              {post.author.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="font-medium">{post.author.name}</p>
              <p className="text-sm text-gray-500">
                {new Date(post.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleLike} 
            className={`flex items-center ${liked ? 'text-green-600' : 'text-gray-500'} hover:text-green-600 transition-colors`}
          >
            <svg 
              className="w-6 h-6" 
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={liked ? "0" : "2"} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
            <span className="ml-1">{post.likes?.length || 0}</span>
          </button>
        </div>
      </div>
      
      {/* Blog Content */}
      <div className="prose prose-lg max-w-none mb-12">
        <div 
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} 
        />
      </div>
      
      {/* Comments Section */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-xl font-serif font-bold mb-6">Comments</h3>
        
        {/* Add Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleAddComment} className="mb-8">
            <div className="mb-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="Add a comment..."
                required
              />
            </div>
            <motion.button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              disabled={commentLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {commentLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                  Posting...
                </div>
              ) : "Post Comment"}
            </motion.button>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-gray-50 rounded-md text-center">
            <p className="text-gray-600 mb-2">Sign in to join the conversation</p>
            <Link to="/login" className="text-green-600 font-medium hover:text-green-700">
              Sign in
            </Link>
          </div>
        )}
        
        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-100 pb-6">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
                    {comment.author.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{comment.author.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BlogPage;
