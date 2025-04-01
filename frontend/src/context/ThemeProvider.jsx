import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: 'light',
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  const themeStyles = {
    primary: '#10B981', // green-600
    background: '#FFFFFF', 
    text: '#1F2937', // gray-800
    accentLight: '#F9FAFB', // gray-50
    accent: '#F3F4F6' // gray-100
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeStyles }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
