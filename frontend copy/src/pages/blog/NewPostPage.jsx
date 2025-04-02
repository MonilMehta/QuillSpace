import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/logo.png"; // Adjust the path as necessary

const NewPostPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPatience, setShowPatience] = useState(false);
  const [previewPost, setPreviewPost] = useState(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
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
      setImageUrl(data.imageUrl);
      return data.imageUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      throw err;
    } finally {
      setImageUploading(false);
    }
  };
  
  const handleOpenPreview = async (e) => {
    e.preventDefault();
    
    // Upload image if needed before showing preview
    let postImageUrl = imageUrl;
    if (image && !imageUrl) {
      try {
        postImageUrl = await uploadImage();
      } catch (err) {
        setError("Image upload failed: " + err.message);
        return;
      }
    }
    
    const previewData = {
      title,
      content,
      imageUrl: postImageUrl,
      createdAt: new Date().toISOString(),
    };
    
    setPreviewPost(previewData);
    setShowPreview(true);
  };
  
  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://backend.monilmeh.workers.dev/api/v1/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          published: isPublished,
          imageUrl: previewPost.imageUrl
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create post");
      }
      
      const post = await res.json();
      setPublishSuccess(true);
      
      // Delay navigation for animation to complete
      setTimeout(() => {
        navigate(`/post/${post.id}`);
      }, 1000);
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err.message || "Failed to create post. Please try again.");
      setShowPreview(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate read time based on content length
  const calculateReadTime = (content) => {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = content?.split(/\s+/)?.length || 0;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return readTime < 1 ? 1 : readTime;
  };
  
  return (
    <motion.div 
      className="max-w-4xl mx-auto px-4 py-6 dark:bg-gray-900"
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
          <img src={logo} alt="QuillWrite Logo" className="h-8 mr-1" />
          <span className="font-serif text-2xl font-bold text-black dark:text-white ml-2">Create a new story</span>
        </motion.div>
      </div>
      
      {error && (
        <motion.div 
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}
      
      <form onSubmit={handleOpenPreview} className="dark:bg-gray-900">
        {/* Cover Image Upload - Improved Design */}
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
              id="cover-image"
            />
            
            <label 
              htmlFor="cover-image"
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
                    setImagePreview(null);
                    setImageUrl("");
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
        </div>
        
        <div className="mb-6">
          <label htmlFor="title" className="sr-only">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-0 py-3 text-3xl font-serif font-bold border-0 border-b border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-green-500 dark:bg-gray-900 dark:text-white"
            required
          />
        </div>
        
        <div className="mb-8 relative">
          <label htmlFor="content" className="sr-only">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell your story..."
            className="w-full px-0 py-3 text-lg min-h-[400px] border-0 focus:outline-none focus:ring-0 dark:bg-gray-900 dark:text-white"
            required
          />
          
          {/* Word count */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
            {content.split(/\s+/).filter(Boolean).length} words • {calculateReadTime(content)} min read
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center">
            <input
              id="publish"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label htmlFor="publish" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Publish immediately
            </label>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            
            <motion.button
              type="submit"
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center"
              disabled={loading || !title || !content || imageUploading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </motion.button>
          </div>
        </div>
      </form>
      
      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={`bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto ${
                publishSuccess ? 'scale-up-center' : ''
              }`}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                ...(publishSuccess && {
                  animation: 'scale-up-center 1s cubic-bezier(0.39, 0.575, 0.565, 1) both'
                })
              }}
            >
              {/* Preview Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                <h3 className="font-bold text-lg dark:text-white">Preview Your Post</h3>
                
                <div className="flex space-x-3">
                  {!loading && (
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Edit
                    </button>
                  )}
                  
                  <motion.button
                    onClick={handleSubmit}
                    className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Publish
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="px-6 py-4">
                {/* Cover Image */}
                {previewPost?.imageUrl && (
                  <div className="mb-8 rounded-xl overflow-hidden">
                    <img 
                      src={previewPost.imageUrl} 
                      alt={previewPost.title} 
                      className="w-full h-[400px] object-cover"
                    />
                  </div>
                )}
                
                {/* Title and Meta */}
                <div className="mb-8">
                  <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 dark:text-white">
                    {previewPost?.title}
                  </h1>
                  
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>{new Date(previewPost?.createdAt || Date.now()).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span>{calculateReadTime(previewPost?.content)} min read</span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                  <div 
                    className="blog-content dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: previewPost?.content.replace(/\n/g, '<br />') }} 
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add a scale-up animation CSS */}
      <style jsx="true">{`
        @keyframes scale-up-center {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(50); opacity: 0; }
        }
        .scale-up-center {
          animation: scale-up-center 1s cubic-bezier(0.39, 0.575, 0.565, 1) both;
        }
      `}</style>
    </motion.div>
  );
};

export default NewPostPage;
