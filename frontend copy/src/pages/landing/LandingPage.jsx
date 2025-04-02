import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import logo from "../../assets/logo.png";
import { useSprings, animated, to as interpolate } from '@react-spring/web';
import { useDrag } from 'react-use-gesture';
import Cookies from 'js-cookie';

// Styles for the card deck
const deckStyles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '500px', // Increased from 400px
    overflow: 'visible',
    userSelect: 'none',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deck: {
    position: 'absolute',
    width: '500px', // Increased from 400px
    maxWidth: '100%',
    height: '450px', // Increased from 300px
    willChange: 'transform',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 12.5px 30px -10px rgba(50, 50, 73, 0.4), 0 10px 10px -10px rgba(50, 50, 73, 0.3)',
    willChange: 'transform',
    padding: '20px',
    overflow: 'hidden',
    touchAction: 'none',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.15,
    zIndex: 0,
    borderRadius: '10px',
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }
};

// Helper functions for card animations
const to = (i) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: -10 + Math.random() * 20,
  delay: i * 100,
});
const from = (_i) => ({ x: 0, rot: 0, scale: 1.5, y: -1000 });
const trans = (r, s) =>
  `perspective(1500px) rotateX(30deg) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`;

// Typewriter text animation component
const TypewriterText = () => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  
  const phrases = [
    "Write your story...",
    "Share your experiences...",
    "Express your ideas...",
    "Inspire others..."
  ];
  
  useEffect(() => {
    const handleTyping = () => {
      const currentIndex = loopNum % phrases.length;
      const currentPhrase = phrases[currentIndex];
      
      setDisplayText(isDeleting 
        ? currentPhrase.substring(0, displayText.length - 1) 
        : currentPhrase.substring(0, displayText.length + 1)
      );
      
      // Set typing speed
      setTypingSpeed(isDeleting ? 80 : 250);
      
      // If completed typing the phrase
      if (!isDeleting && displayText === currentPhrase) {
        // Pause at the end of phrase
        setTimeout(() => setIsDeleting(true), 1500);
      } 
      // If completed deleting the phrase
      else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        // Pause before typing next phrase
        setTypingSpeed(500);
      }
    };
    
    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, typingSpeed, phrases]);
  
  return (
    <div className="relative h-72 w-full max-w-md mx-auto rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-green-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-24 flex items-center justify-center">
            <span className="text-2xl text-gray-700 dark:text-gray-200 font-medium">{displayText}</span>
            <motion.span 
              className="inline-block w-0.5 h-6 bg-gray-800 dark:bg-gray-300 ml-1" 
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">A platform for thinkers and creators</span>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gone] = useState(() => new Set());
  const cardsRef = useRef(null);
  const isInView = useInView(cardsRef, { once: false, amount: 0.2 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("https://backend.monilmeh.workers.dev/api/v1/blogs");
        if (!res.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await res.json();
        // Only keep the first 4 posts for the swipeable cards
        setFeaturedPosts(data.slice(0, 4));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError("Failed to load posts. Please try again later.");
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Create springs only after data is loaded
  const [props, api] = useSprings(featuredPosts.length, i => ({
    ...to(i),
    from: from(i),
  }));

  // Update springs when featuredPosts changes
  useEffect(() => {
    if (featuredPosts.length > 0) {
      api.start(i => ({
        ...to(i),
        from: from(i),
      }));
    }
  }, [featuredPosts, api]);

  // Bind gesture handler for dragging cards
  const bind = useDrag(({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
    const trigger = velocity > 0.2; // If you flick hard enough it should trigger the card to fly out
    const dir = xDir < 0 ? -1 : 1; // Direction should either point left or right
    if (!down && trigger) gone.add(index); // If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
    api.start(i => {
      if (index !== i) return; // We're only interested in changing spring-data for the current spring
      const isGone = gone.has(index);
      // Limit the maximum x displacement to prevent horizontal overflow
      const maxDisplacement = 200;
      const x = isGone ? (maxDisplacement + window.innerWidth) * dir : down ? Math.max(Math.min(mx, maxDisplacement), -maxDisplacement) : 0;
      const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0); // How much the card tilts, flicking it harder makes it rotate faster
      const scale = down ? 1.1 : 1; // Active cards lift up a bit
      return {
        x,
        rot,
        scale,
        delay: undefined,
        config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
      };
    });
    if (!down && gone.size === featuredPosts.length)
      setTimeout(() => {
        gone.clear();
        api.start(i => to(i));
      }, 600);
  });

  // Function to check authentication before viewing a post
  const handlePostClick = (e, postId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is authenticated by looking for JWT token
    const token = Cookies.get('token') || localStorage.getItem('token');
    
    if (token) {
      // User is authenticated, navigate to post
      navigate(`/post/${postId}`);
    } else {
      // User is not authenticated, redirect to signin
      navigate('/login', { state: { redirectTo: `/post/${postId}` } });
    }
  };

  // Add CSS variables for dark mode
  useEffect(() => {
    // Set CSS variables for cards based on dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');
    document.documentElement.style.setProperty('--card-bg-color', isDarkMode ? '#1f2937' : 'white');
    
    // Listen for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          document.documentElement.style.setProperty('--card-bg-color', isDark ? '#1f2937' : 'white');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="dark:bg-gray-900 overflow-hidden"> {/* Added overflow-hidden to prevent horizontal scroll */}

      {/* Animated Hero Section with Typewriter Animation */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <motion.h1 
                className="font-serif text-5xl md:text-6xl font-extrabold tracking-tight mb-8 dark:text-white"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                Where <span className="text-green-600">good ideas</span> find you
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl mb-10 text-gray-600 dark:text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Discover stories, thinking, and perspectives from writers on any topic.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-black dark:bg-gray-800 rounded-full text-white font-medium text-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors transform hover:scale-105 duration-300"
                >
                  Start reading
                </Link>
              </motion.div>
            </div>
            <div className="md:w-1/2">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                {/* Replace with Typewriter Text Animation */}
                <TypewriterText />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts with Interactive Card Deck */}
      <section className="py-16 dark:bg-gray-900 overflow-hidden" ref={cardsRef}> {/* Added overflow-hidden */}
        <div className="container mx-auto px-4 overflow-hidden"> {/* Added overflow-hidden */}
          <h2 className="font-serif text-3xl font-bold mb-12 border-b pb-4 dark:text-white dark:border-gray-700">Featured Stories</h2>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-green-600 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading stories...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          ) : featuredPosts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-400">No stories available yet.</p>
            </div>
          ) : (
            <div style={deckStyles.container}>
              {props.map(({ x, y, rot, scale }, i) => (
                <animated.div style={{ ...deckStyles.deck, x, y }} key={i}>
                  <animated.div
                    {...bind(i)}
                    style={{
                      ...deckStyles.card,
                      transform: interpolate([rot, scale], trans),
                      backgroundColor: "var(--card-bg-color, white)"
                    }}
                    className="dark:bg-gray-800 dark:text-white"
                  >
                    {/* Image Overlay */}
                    {featuredPosts[i]?.imageUrl && (
                      <div
                        style={{
                          ...deckStyles.imageOverlay,
                          backgroundImage: `url(${featuredPosts[i].imageUrl})`,
                        }}
                      />
                    )}
                    
                    {/* Card Content */}
                    <div style={deckStyles.cardContent}>
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                          {featuredPosts[i]?.author?.name?.charAt(0) || "A"}
                        </div>
                        <span className="ml-2 text-sm font-medium dark:text-gray-200">
                          {featuredPosts[i]?.author?.name || "Anonymous"}
                        </span>
                      </div>
                      
                      <h3 className="font-serif text-xl font-bold mb-3 dark:text-white">
                        {featuredPosts[i]?.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-grow">
                        {featuredPosts[i]?.content?.substring(0, 120)}...
                      </p>
                      
                      {/* Updated to check authentication */}
                      <button 
                        onClick={(e) => handlePostClick(e, featuredPosts[i]?.id)}
                        className="inline-block mt-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium"
                      >
                        Continue reading →
                      </button>
                    </div>
                  </animated.div>
                </animated.div>
              ))}
            </div>
          )}
          
          {/* Instructions for user */}
          <div className="text-center mt-8 text-gray-500 dark:text-gray-400 text-sm">
            <p>Swipe cards left or right to browse</p>
          </div>
          
          {/* View all stories link - also check authentication */}
          <div className="text-center mt-12">
            <button 
              onClick={() => {
                const token = Cookies.get('token') || localStorage.getItem('token');
                if (token) {
                  navigate('/blogs');
                } else {
                  navigate('/signin', { state: { redirectTo: '/blogs' } });
                }
              }}
              className="inline-flex items-center justify-center px-6 py-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 font-medium rounded-full transition-colors"
            >
              View all stories
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Testimonial/Quote Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <blockquote className="text-center">
            <p className="font-serif text-3xl italic mb-6 dark:text-white">
              "The only thing better than reading is writing. The only thing better than writing is publishing."
            </p>
            <footer className="text-gray-600 dark:text-gray-400">
              — A Writer's Wisdom
            </footer>
          </blockquote>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;