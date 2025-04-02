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
  const [readTime, setReadTime] = useState(0);
  
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  
  // Calculate read time based on content length
  const calculateReadTime = (content) => {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = content?.split(/\s+/)?.length || 0;
    const time = Math.ceil(wordCount / wordsPerMinute);
    return time < 1 ? 1 : time;
  };
  
  // Fetch blog post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`https://backend.monilmeh.workers.dev/api/v1/blog/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch post");
        }
        const data = await res.json();
        setPost(data);
        
        // Calculate read time
        setReadTime(calculateReadTime(data.content));
        
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
        const res = await fetch(`https://backend.monilmeh.workers.dev/api/v1/blog/${id}/comments`);
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
      const res = await fetch(`https://backend.monilmeh.workers.dev/api/v1/blog/${id}/comment`, {
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
        `https://backend.monilmeh.workers.dev/api/v1/blog/${id}/unlike` : 
        `https://backend.monilmeh.workers.dev/api/v1/blog/${id}/like`;
      
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
      // Update the likes count in the post object
      setPost(prev => {
        const likeCount = prev.likes?.length || 0;
        return {
          ...prev,
          likes: liked 
            ? prev.likes.filter(like => like.id !== user.id)
            : [...(prev.likes || []), { id: user.id }]
        };
      });
    } catch (err) {
      console.error("Error updating like:", err);
    }
  };
  
  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content?.substring(0, 100) || 'Check out this article',
        url: window.location.href
      }).catch(err => console.log('Error sharing', err));
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Could not copy link: ', err));
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
          <h2 className="text-xl font-medium text-red-600 dark:text-red-400 mb-3">Error</h2>
          <p className="text-gray-700 dark:text-gray-300">{error || "Blog post not found"}</p>
          <Link 
            to="/" 
            className="mt-4 inline-block px-5 py-2 bg-black dark:bg-gray-800 text-white rounded-full"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="max-w-4xl mx-auto px-4 py-6 dark:bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Featured Image */}
      {post.imageUrl && (
        <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-[400px] object-cover"
          />
        </div>
      )}
      
      {/* Blog Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 dark:text-white">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
              {post.author.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="font-medium dark:text-white">{post.author.name}</p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>{readTime} min read</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button 
              onClick={handleShare}
              className="flex items-center text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
            
            <button 
              onClick={handleLike} 
              className={`flex items-center ${liked ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'} hover:text-green-600 dark:hover:text-green-400 transition-colors`}
            >
              <svg 
                className="w-5 h-5 mr-1" 
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
              <span>{post.likes?.length || 0}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Blog Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
        <div 
          className="blog-content dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} 
        />
      </div>
      
      {/* Tags and Actions */}
      <div className="mb-10 flex flex-wrap justify-between items-center">
        <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
          {["Technology", "Writing", "Blog"].map(tag => (
            <Link 
              key={tag}
              to={`/blogs?topic=${tag.toLowerCase()}`}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm px-3 py-1 rounded-full transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleShare}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          
          <button
            onClick={() => {
              // Print the article for saving
              window.print();
            }}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Save
          </button>
        </div>
      </div>
      
      {/* Comments Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h3 className="text-xl font-serif font-bold mb-6 dark:text-white">Comments</h3>
        
        {/* Add Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleAddComment} className="mb-8">
            <div className="mb-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
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
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-md text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">Sign in to join the conversation</p>
            <Link to="/login" className="text-green-600 dark:text-green-400 font-medium hover:text-green-700 dark:hover:text-green-300">
              Sign in
            </Link>
          </div>
        )}
        
        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-6">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-100 dark:border-gray-800 pb-6">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center">
                    {comment.author.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium dark:text-white">{comment.author.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BlogPage;
