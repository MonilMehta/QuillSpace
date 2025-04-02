import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../assets/logo.png"; // Adjust the path as necessary

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="container mx-auto px-4 py-16 flex-grow flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            className="inline-block"
          >
            <img src={logo} alt="QuillWrite Logo" className="h-16 mb-4" />
          </motion.div>
          
          <h1 className="font-serif text-6xl font-bold mt-6 mb-4">404</h1>
          <h2 className="text-2xl font-medium mb-6">Page not found</h2>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Link 
            to="/" 
            className="px-6 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
