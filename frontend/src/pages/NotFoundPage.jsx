import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

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
            <svg className="w-16 h-16 mx-auto text-green-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.462 0c1.02 0 2.414 1.384 3.015 2.236C11.52 5.32 13.097 8.986 15 12.5c-1.003-1.765-2.847-4.174-3.757-5.207-.302 1.615-1.147 5.093-4.304 7.707 1.812-5.211.948-11.376-1.813-15h1.336zm3.71 21c-2.198 0-4.33-1.15-5.516-2.996a.664.664 0 0 1 .536-1.04h4.98c.222 0 .417.15.487.366C11.114 19.373 10.636 21 10.172 21z" />
            </svg>
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
