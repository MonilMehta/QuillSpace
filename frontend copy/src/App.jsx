import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";
import LandingPage from "./pages/landing/LandingPage";
import HomePage from "./pages/home/HomePage";
import Navbar from "./components/Navbar";
import Footer from "./pages/footer/footer"; // Adjust path if needed
import { ThemeProvider } from "./context/ThemeProvider";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import NotFoundPage from "./pages/NotFoundPage";
import { AuthProvider } from "./context/AuthContext";

// Lazy-loaded components
const CreatePostPage = lazy(() => import("./pages/blog/NewPostPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/profile/SettingsPage"));
const PostDetailPage = lazy(() => import("./pages/blog/BlogPage"));
const BlogsPage = lazy(() => import("./pages/blogs/AllBlogsPage"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-[50vh]">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
  </div>
);

// Protected route component
const ProtectedRoute = () => {
  const token = Cookies.get("token") || localStorage.getItem("token");
  
  // If not authenticated, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the outlet
  return <Outlet />;
};

// Guest route component (for routes that should only be accessible to non-logged in users)
const GuestRoute = () => {
  const token = Cookies.get("token") || localStorage.getItem("token");
  
  // If authenticated, redirect to home
  if (token) {
    return <Navigate to="/home" replace />;
  }
  
  // If not authenticated, render the outlet
  return <Outlet />;
};

// Main layout component
const MainLayout = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 dark:text-white flex flex-col font-['Inter',sans-serif]">
    <Navbar />
    <div className="flex-grow">
      <Outlet />
    </div>
    <Footer />
  </div>
);

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<MainLayout />}>
              {/* Guest routes */}
              <Route element={<GuestRoute />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/new-post" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <CreatePostPage />
                  </Suspense>
                } />
                <Route path="/profile" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProfilePage />
                  </Suspense>
                } />
                <Route path="/settings" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <SettingsPage />
                  </Suspense>
                } />
              </Route>
              
              {/* Both accessible routes */}
              <Route path="/post/:id" element={
                <Suspense fallback={<LoadingFallback />}>
                  <PostDetailPage />
                </Suspense>
              } />
              <Route path="/blogs" element={
                <Suspense fallback={<LoadingFallback />}>
                  <BlogsPage />
                </Suspense>
              } />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
