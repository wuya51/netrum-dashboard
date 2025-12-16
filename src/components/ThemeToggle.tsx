
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button 
      onClick={toggleTheme}
      className="bg-gradient-to-r from-blue-400 to-purple-500 dark:from-blue-600 dark:to-purple-600 text-white border border-blue-300 dark:border-blue-500 rounded-full w-10 h-10 flex items-center justify-center text-xl cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 hover:from-blue-500 hover:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700"
      aria-label="Switch themes"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}