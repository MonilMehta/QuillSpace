import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const HomePage = () => {
  const { user } = useAuth();
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const carouselRef = useRef(null);
  const touchStartY = useRef(0);
  const [showSwipeEffect, setShowSwipeEffect] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState('up');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const dragControls = useDragControls();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Fetch recent posts
        const response = await fetch('http://127.0.0.1:8787/api/v1/blogs/recent');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        
        const data = await response.json();
        
        // Get all posts for the featured section
        const allPostsResponse = await fetch('http://127.0.0.1:8787/api/v1/blogs');
        if (!allPostsResponse.ok) {
          throw new Error('Failed to fetch all posts');
        }
        
        const allPostsData = await allPostsResponse.json();
        
        // Use recent posts for the hero section
        setFeaturedPosts(data);
        
        // Use the rest of the posts for the recent section (excluding ones in featured)
        const featuredIds = new Set(data.map(post => post.id));
        const otherPosts = allPostsData.filter(post => !featuredIds.has(post.id)).slice(0, 6);
        setRecentPosts(otherPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        // Use dummy data if API fails
        setFeaturedPosts(dummyFeaturedPosts);
        setRecentPosts(dummyRecentPosts);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPosts();
  }, []);

  useEffect(() => {
    // Show swipe animation initially
    setTimeout(() => {
      setShowSwipeEffect(true);
      setTimeout(() => setShowSwipeEffect(false), 3000);
    }, 1500);

    const carousel = carouselRef.current;
    if (!carousel) return;

    // Handle touch events for swipe
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      e.preventDefault(); // Prevent scrolling while swiping
    };

    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY.current - touchEndY;
      
      // Don't allow scrolling if already in transition
      if (isScrolling) return;
      
      // Swipe up
      if (diff > 50) {
        handleNextSlide();
        showSwipeAnimation('up');
      }
      // Swipe down
      else if (diff < -50) {
        handlePrevSlide();
        showSwipeAnimation('down');
      }
    };

    // Handle wheel events for desktop
    const handleWheel = (e) => {
      if (carousel.contains(e.target)) {
        e.preventDefault();
        
        // Don't allow scrolling if already in transition
        if (isScrolling) return;
        
        if (e.deltaY > 0) {
          handleNextSlide();
          showSwipeAnimation('up');
        } else {
          handlePrevSlide();
          showSwipeAnimation('down');
        }
      }
    };

    carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
    carousel.addEventListener('touchmove', handleTouchMove, { passive: false });
    carousel.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Add wheel event with a debounce
    const wheelHandler = (e) => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => handleWheel(e), 50);
    };
    carousel.addEventListener('wheel', wheelHandler, { passive: false });

    // Add keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevSlide();
        showSwipeAnimation('down');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextSlide();
        showSwipeAnimation('up');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      carousel.removeEventListener('touchstart', handleTouchStart);
      carousel.removeEventListener('touchmove', handleTouchMove);
      carousel.removeEventListener('touchend', handleTouchEnd);
      carousel.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isScrolling]);

  const showSwipeAnimation = (direction) => {
    setSwipeDirection(direction);
    setShowSwipeEffect(true);
    setTimeout(() => setShowSwipeEffect(false), 800);
  };

  const handleNextSlide = () => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    if (activeCarouselIndex < featuredPosts.length - 1) {
      setActiveCarouselIndex(activeCarouselIndex + 1);
    } else {
      setActiveCarouselIndex(0); // Loop back to the beginning
    }
    
    // Prevent rapid scrolling
    setTimeout(() => setIsScrolling(false), 700);
  };

  const handlePrevSlide = () => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    if (activeCarouselIndex > 0) {
      setActiveCarouselIndex(activeCarouselIndex - 1);
    } else {
      setActiveCarouselIndex(featuredPosts.length - 1); // Loop to the end
    }
    
    // Prevent rapid scrolling
    setTimeout(() => setIsScrolling(false), 700);
  };

  const handleDragEnd = (event, info) => {
    if (isScrolling) return;
    
    // Detect vertical drag direction
    if (info.offset.y < -50) { // Dragged up
      handleNextSlide();
      showSwipeAnimation('up');
    } else if (info.offset.y > 50) { // Dragged down
      handlePrevSlide();
      showSwipeAnimation('down');
    }
  };

  // Calculate read time based on content length
  const calculateReadTime = (content) => {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = content?.split(/\s+/)?.length || 0;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return readTime < 1 ? 1 : readTime;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh] dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="dark:bg-gray-900">
      {/* Hero Section with Vertical Carousel */}
      <section className="h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-900" ref={carouselRef}>
        {/* Carousel Indicators - Vertical dots */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2 z-20">
          {featuredPosts.map((_, index) => (
            <motion.button
              key={index}
              className={`rounded-full bg-white dark:bg-gray-700 shadow-md hover:scale-110 transition duration-300 ${
                index === activeCarouselIndex 
                  ? 'w-2 h-8 bg-green-500 dark:bg-green-500' 
                  : 'w-2 h-2'
              }`}
              animate={{ 
                height: index === activeCarouselIndex ? 32 : 8,
                opacity: index === activeCarouselIndex ? 1 : 0.7
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onClick={() => setActiveCarouselIndex(index)}
            />
          ))}
        </div>
        
        {/* Swipe Indicator with Ripple Effect */}
        <AnimatePresence>
          {showSwipeEffect && (
            <motion.div 
              className={`absolute inset-x-0 ${swipeDirection === 'up' ? 'bottom-8' : 'top-8'} flex justify-center z-30 pointer-events-none`}
              initial={{ opacity: 0, scale: 0.8, y: swipeDirection === 'up' ? 20 : -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative flex flex-col items-center">
                {/* Ripple Effect */}
                <motion.div
                  className="absolute w-12 h-12 rounded-full bg-green-500/20"
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ 
                    scale: [0.8, 1.5, 2],
                    opacity: [0.8, 0.4, 0] 
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeOut"
                  }}
                />
                <motion.div
                  className="absolute w-10 h-10 rounded-full bg-green-500/30"
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ 
                    scale: [0.6, 1.2, 1.8],
                    opacity: [0.8, 0.5, 0] 
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 1.5,
                    delay: 0.2,
                    ease: "easeOut"
                  }}
                />
                
                {/* Arrow */}
                <motion.div 
                  className="bg-white/90 dark:bg-gray-800/90 shadow-lg rounded-full p-2 backdrop-blur-sm z-10"
                  animate={{ y: swipeDirection === 'up' ? [-5, 5, -5] : [5, -5, 5] }}
                  transition={{ 
                    duration: 1.2, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                >
                  <svg 
                    className="w-6 h-6 text-green-600 dark:text-green-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d={swipeDirection === 'up' 
                        ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                        : "M19 14l-7 7m0 0l-7-7m7 7V3"
                      } 
                    />
                  </svg>
                </motion.div>
                <span className="mt-2 text-xs font-semibold text-white bg-black/40 dark:bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                  Swipe {swipeDirection}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Full Screen Carousel */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            {featuredPosts.map((post, index) => {
              const readTime = calculateReadTime(post.content);
              
              return index === activeCarouselIndex ? (
                <motion.div
                  key={post.id}
                  className="absolute inset-0 w-full h-full"
                  initial={{ opacity: 0, y: swipeDirection === 'up' ? 100 : -100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: swipeDirection === 'up' ? -100 : 100 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.1}
                  onDragEnd={handleDragEnd}
                  dragControls={dragControls}
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="relative w-full h-full cursor-grab active:cursor-grabbing">
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 bg-black/40 z-0"></div>
                    <img 
                      src={post.imageUrl || `https://source.unsplash.com/random/1920x1080?writing,${index}`} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="max-w-4xl w-full px-6">
                        <Link to={`/post/${post.id}`} className="block pointer-events-auto">
                          <motion.div 
                            className="bg-white/10 dark:bg-black/30 backdrop-blur-md p-8 rounded-xl border border-white/20 shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-white text-gray-800 flex items-center justify-center font-bold">
                                  {post.author?.name?.charAt(0) || "A"}
                                </div>
                                <div className="ml-3">
                                  <p className="font-medium text-white">{post.author?.name || "Anonymous"}</p>
                                  <p className="text-sm text-gray-300">
                                    {new Date(post.createdAt || Date.now()).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <span className="bg-black/30 text-white px-3 py-1 rounded-full text-sm">
                                {readTime} min read
                              </span>
                            </div>
                            
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                              {post.title}
                            </h2>
                            
                            <p className="text-gray-200 mb-6 line-clamp-3">
                              {post.content?.substring(0, 200).replace(/<[^>]*>/g, '') || "No content available."}...
                            </p>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex space-x-4 text-gray-200">
                                <div className="flex items-center">
                                  <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span>{post.likes?.length || 0}</span>
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                  </svg>
                                  <span>{post.comments?.length || 0}</span>
                                </div>
                              </div>
                              
                              <div className="flex space-x-3">
                                <button 
                                  className="text-white hover:text-green-400 transition-colors"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigator.share({
                                      title: post.title,
                                      text: post.content?.substring(0, 100) || 'Check out this article',
                                      url: window.location.origin + `/post/${post.id}`
                                    }).catch(err => console.log('Error sharing', err));
                                  }}
                                >
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                  </svg>
                                </button>
                                <span className="inline-block px-4 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors">
                                  Read story
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null;
            })}
          </AnimatePresence>
        </div>
        
        {/* Navigation buttons - visible on large screens */}
        <div className="hidden md:block">
          <button 
            className="absolute top-1/2 left-4 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-full transition-colors transform -translate-y-20"
            onClick={handlePrevSlide}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
          <button 
            className="absolute top-1/2 left-4 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-full transition-colors transform translate-y-20"
            onClick={handleNextSlide}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </section>
      
      {/* Recent Articles Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-bold dark:text-white">
              <span className="border-b-2 border-green-500 pb-1">Latest Stories</span>
            </h2>
            <Link 
              to="/blogs" 
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center"
            >
              View all
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post, index) => {
              const readTime = calculateReadTime(post.content);
              
              return (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <Link to={`/post/${post.id}`} className="block">
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={post.imageUrl || `https://source.unsplash.com/random/600x400?sig=${index}`} 
                        alt={post.title} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                          <h3 className="text-white text-lg font-bold line-clamp-1">
                            {post.title}
                          </h3>
                          <span className="text-xs bg-black/40 text-white px-2 py-1 rounded-full">
                            {readTime} min read
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white flex items-center justify-center font-bold">
                          {post.author?.name?.charAt(0) || "A"}
                        </div>
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{post.author?.name || "Anonymous"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(post.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {post.content?.substring(0, 120).replace(/<[^>]*>/g, '') || "No content preview available."}...
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-gray-500 text-sm space-x-3">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{post.likes?.length || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <span>{post.comments?.length || 0}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            className="text-gray-500 hover:text-green-600 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.share({
                                title: post.title,
                                text: post.content?.substring(0, 100) || 'Check out this article',
                                url: window.location.origin + `/post/${post.id}`
                              }).catch(err => console.log('Error sharing', err));
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          </button>
                          <span className="text-green-600 hover:text-green-700 text-sm font-medium">Read more</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          
          {/* Write your own button */}
          <div className="text-center mt-16">
            <Link 
              to="/new-post" 
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-md hover:shadow-lg"
            >
              Write your story
            </Link>
          </div>
        </div>
      </section>
      
      {/* Topics Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center dark:text-white">Discover topics that matter to you</h2>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {["Technology", "Programming", "Design", "Writing", "Data Science", 
              "Business", "Self Improvement", "Relationships", "Productivity", "Machine Learning"].map((topic) => (
              <Link 
                key={topic}
                to={`/blogs?topic=${topic.toLowerCase()}`}
                className="px-6 py-2 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:shadow-md transition-shadow text-gray-700 dark:text-gray-200 font-medium"
              >
                {topic}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Dummy data in case API fails
const dummyFeaturedPosts = [
  {
    id: 1,
    title: "The Future of JavaScript Development",
    summary: "Explore the upcoming features and trends that will shape the JavaScript ecosystem in the coming years.",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    author: {
      name: "Sarah Johnson",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Building Scalable React Applications",
    summary: "Learn the best practices for structuring your React applications to ensure they can grow without becoming unmaintainable.",
    imageUrl: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613",
    author: {
      name: "Michael Chen",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "The Art of Technical Writing",
    summary: "Discover how to communicate complex technical concepts in a clear and engaging way that readers will understand and enjoy.",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    author: {
      name: "Emma Davis",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    createdAt: new Date().toISOString()
  }
];

const dummyRecentPosts = [
  {
    id: 4,
    title: "CSS Grid vs Flexbox: When to Use Each",
    summary: "A practical guide to choosing the right CSS layout system for different UI challenges.",
    author: {
      name: "Alex Rivera",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg"
    },
    content: "When it comes to modern CSS layout techniques, CSS Grid and Flexbox are two powerful options that solve different types of layout problems. This article examines when to use each one.",
    createdAt: new Date().toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1517134191118-9d595e4c8c2b"
  },
  {
    id: 5,
    title: "Understanding TypeScript Generics",
    summary: "A deep dive into TypeScript generics and how they can make your code more reusable and type-safe.",
    author: {
      name: "Priya Patel",
      avatar: "https://randomuser.me/api/portraits/women/57.jpg"
    },
    content: "TypeScript generics provide a way to create reusable components that work with a variety of types rather than a single one. This article explores how to use them effectively.",
    createdAt: new Date().toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1619410283995-43d9134e7656"
  },
  {
    id: 6,
    title: "Optimizing React Performance",
    summary: "Learn strategies to identify and fix performance bottlenecks in your React applications.",
    author: {
      name: "James Wilson",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    content: "React applications can sometimes suffer from performance issues. This guide shows you how to identify those issues and apply the right optimization techniques to solve them.",
    createdAt: new Date().toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee"
  },
  {
    id: 7,
    title: "Introduction to Web Accessibility",
    summary: "Why accessibility matters and how to make your websites more inclusive for all users.",
    author: {
      name: "Maria Garcia",
      avatar: "https://randomuser.me/api/portraits/women/89.jpg"
    },
    content: "Web accessibility is about making websites usable for people of all abilities and disabilities. This article introduces key principles and techniques for creating accessible web experiences.",
    createdAt: new Date().toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
  },
  {
    id: 8,
    title: "The Complete Guide to CSS Variables",
    summary: "Everything you need to know about CSS custom properties and how they can improve your workflow.",
    author: {
      name: "David Kim",
      avatar: "https://randomuser.me/api/portraits/men/76.jpg"
    },
    content: "CSS Variables (officially called Custom Properties) allow you to define reusable values in your CSS. Learn how they work and how they compare to variables in preprocessors like Sass.",
    createdAt: new Date().toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1544982503-9f984c14501a"
  },
  {
    id: 9,
    title: "Building a RESTful API with Node.js",
    summary: "A step-by-step guide to creating a robust and scalable API using Node.js and Express.",
    author: {
      name: "Sophie Brown",
      avatar: "https://randomuser.me/api/portraits/women/42.jpg"
    },
    content: "This tutorial walks through building a RESTful API from scratch using Node.js and Express, covering routes, controllers, middleware, authentication, and more.",
    createdAt: new Date().toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1500595046743-cd271d694e30"
  }
];

export default HomePage;
