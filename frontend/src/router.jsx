import { createBrowserRouter, ScrollRestoration } from "react-router-dom";
import App from "./App";
import LandingPage from "./pages/landing/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import NotFoundPage from "./pages/NotFoundPage";
import { lazy, Suspense } from "react";

// Lazy-loaded components
const BlogPage = lazy(() => import("./pages/blog/BlogPage"));
const NewPostPage = lazy(() => import("./pages/blog/NewPostPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const AllBlogsPage = lazy(() => import("./pages/blogs/AllBlogsPage"));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-[50vh]">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: "login",
        element: <LoginPage />
      },
      {
        path: "signup",
        element: <SignupPage />
      },
      {
        path: "post/:id",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BlogPage />
            <ScrollRestoration />
          </Suspense>
        )
      },
      {
        path: "new-post",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NewPostPage />
          </Suspense>
        )
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProfilePage />
          </Suspense>
        )
      },
      {
        path: "blogs",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AllBlogsPage />
            <ScrollRestoration />
          </Suspense>
        )
      }
    ]
  }
]);

export default router;
