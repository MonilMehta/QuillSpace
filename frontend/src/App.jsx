import Footer from "./pages/footer/footer";
import Navbar from "./pages/components/Navbar";
import { ThemeProvider } from "./context/ThemeProvider";
import { Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

function App() {
  const location = useLocation();
  
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-white flex flex-col font-['Inter',sans-serif]">
          <Navbar />
          <AnimatePresence mode="wait">
            <motion.main 
              key={location.pathname}
              className="container mx-auto px-4 py-8 flex-grow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
          <Footer />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
