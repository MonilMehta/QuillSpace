import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png"; // Adjust the path as necessary

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="flex items-center">
              {/* Quill Icon */}
              <img src={logo} alt="QuillWrite Logo" className="h-8 mr-1" />

              <span className="font-serif text-xl font-bold text-black dark:text-white ml-2">Quill<span className="text-green-600">space</span></span>
            </Link>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              A space for thoughtful writing and ideas.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-6">
            <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
              About
            </Link>
            <Link to="/help" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
              Help
            </Link>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            >
              Twitter
            </a>
            <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
              Terms
            </Link>
            <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
              Privacy
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Quillspace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;