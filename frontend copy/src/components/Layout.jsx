import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from '../pages/footer/footer';

const Layout = ({ children }) => {
  // Check for dark mode preference on component mount
  useEffect(() => {
    const isDarkMode = 
      localStorage.getItem('darkMode') === 'true' || 
      (!('darkMode' in localStorage) && 
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
