import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/blogs?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className={`flex items-center ${className}`}>
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search articles..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
