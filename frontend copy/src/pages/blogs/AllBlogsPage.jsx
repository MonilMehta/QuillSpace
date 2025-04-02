import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext'; // Add this import

const AllBlogsPage = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user authentication status
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get('search') || '';
  
  const categories = [
    'all',
    'programming',
    'design',
    'technology',
    'productivity',
    'career',
    'artificial intelligence'
  ];
  
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://backend.monilmeh.workers.dev/api/v1/blogs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        
        const data = await response.json();
        
        // Filter posts based on search term if provided
        let filteredPosts = [...data];
        
        if (searchTerm) {
          filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            post.content.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (selectedCategory !== 'all') {
          // In a real app, you would have category data in your posts
          // For now, we'll just show all posts regardless of category
          // This is a placeholder for future functionality
        }
        
        setPosts(filteredPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        // Use dummy data if API fails
        setPosts(dummyPosts);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPosts();
  }, [searchTerm, selectedCategory]);
  
  const handleClearFilters = () => {
    setSelectedCategory('all');
    navigate('/blogs');
  };
  
  // Calculate read time based on content length
  const calculateReadTime = (content) => {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = content?.split(/\s+/)?.length || 0;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return readTime < 1 ? 1 : readTime;
  };
  
  // Handle click on blog post card
  const handlePostClick = (e, postId) => {
    e.preventDefault();
    
    if (user) {
      // User is authenticated, allow them to read the post
      navigate(`/post/${postId}`);
    } else {
      // User is not authenticated, redirect to login
      navigate(`/login?redirect=/post/${postId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 dark:bg-gray-900">
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-4 dark:text-white">Explore Articles</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover stories, thoughts, and expertise from writers on any topic
        </p>
      </motion.div>
      
      {/* Filter section - no search bar since it's now in navbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-10">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(category => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full text-sm capitalize transition-colors ${
                selectedCategory === category
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Results info */}
      <div className="mb-8 text-gray-600 dark:text-gray-400 flex justify-between items-center">
        <div>
          {isLoading ? (
            'Searching for articles...'
          ) : (
            <>
              {searchTerm && <span>Search results for "{searchTerm}" </span>}
              {selectedCategory !== 'all' && <span>in {selectedCategory} </span>}
              <span>({posts.length} articles found)</span>
            </>
          )}
        </div>
        
        {(searchTerm || selectedCategory !== 'all') && (
          <button
            onClick={handleClearFilters}
            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
      </div>
      
      {/* Posts grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : posts.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {posts.map((post, index) => {
            const readTime = calculateReadTime(post.content);
            
            return (
              <motion.div 
                key={post.id} 
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * (index % 6) }}
              >
                <a 
                  href={`/post/${post.id}`} 
                  onClick={(e) => handlePostClick(e, post.id)}
                  className="block"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={post.imageUrl || `https://source.unsplash.com/random/600x400?sig=${index}`} 
                      alt={post.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <h3 className="text-white text-lg font-bold line-clamp-2">
                        {post.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white flex items-center justify-center font-bold">
                          {post.author?.name?.charAt(0) || "A"}
                        </div>
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{post.author?.name || "Anonymous"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(post.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                        {readTime} min read
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {post.content?.substring(0, 150).replace(/<[^>]*>/g, '') || "No content available."}...
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                        <div className="flex items-center mr-3">
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
                          className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
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
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                        <span className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium">
                          {user ? "Read" : "Sign in to read"}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3 className="text-xl font-bold mb-2 dark:text-white">No articles found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your search or filter to find what you're looking for</p>
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

// Dummy data
const dummyPosts = [
  {
    id: 1,
    title: "Getting Started with React Hooks",
    content: "Learn how to use React Hooks to simplify your functional components and manage state effectively.",
    imageUrl: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2",
    author: {
      name: "Sarah Johnson",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 2,
    title: "Designing User-Friendly Forms",
    content: "Best practices for creating intuitive and accessible forms that provide a great user experience.",
    imageUrl: "https://images.unsplash.com/photo-1545239351-ef35f43d514b",
    author: {
      name: "Michael Chen",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 3,
    title: "The Future of Artificial Intelligence",
    content: "Exploring emerging trends in AI and how they will impact various industries in the coming years.",
    imageUrl: "https://images.unsplash.com/photo-1526378800651-c1a63d2b0ca6",
    author: {
      name: "Emma Davis",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 4,
    title: "Advanced CSS Techniques",
    content: "Level up your styling with these advanced CSS techniques that will make your websites stand out.",
    imageUrl: "https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19",
    author: {
      name: "Alex Rivera",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 5,
    title: "Mastering Time Management for Developers",
    content: "Practical strategies to improve your productivity and achieve a better work-life balance.",
    imageUrl: "https://images.unsplash.com/photo-1553034545-32d4cd2168f1",
    author: {
      name: "Priya Patel",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 6,
    title: "Building a Career in Tech",
    content: "Guidance on navigating the tech industry, advancing your career, and finding fulfilling opportunities.",
    imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
    author: {
      name: "James Wilson",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 7,
    title: "Introduction to Machine Learning",
    content: "A beginner-friendly guide to understanding the basic concepts and applications of machine learning.",
    imageUrl: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387",
    author: {
      name: "Maria Garcia",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 8,
    title: "The Evolution of Web Design",
    content: "Exploring how web design has changed over the years and what trends are shaping its future.",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    author: {
      name: "David Kim",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 9,
    title: "Modern JavaScript Features You Should Know",
    content: "An overview of the most useful JavaScript features introduced in recent years and how to use them.",
    imageUrl: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a",
    author: {
      name: "Sophie Brown",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 10,
    title: "How 5G Will Transform Technology",
    content: "Understanding the impact of 5G networks on various technological domains and everyday life.",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    author: {
      name: "Omar Hassan",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 11,
    title: "Effective Remote Collaboration Tools",
    content: "A review of the best tools and practices for productive remote work and team collaboration.",
    imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf",
    author: {
      name: "Natalie Wong",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  },
  {
    id: 12,
    title: "The Rise of No-Code Development",
    content: "How no-code platforms are changing the development landscape and empowering non-technical creators.",
    imageUrl: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356",
    author: {
      name: "Thomas Johnson",
    },
    createdAt: new Date().toISOString(),
    likes: [{}, {}, {}],
    comments: [{}, {}]
  }
];

export default AllBlogsPage;
