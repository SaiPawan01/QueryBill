 import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

function Navbar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const logout = () => {
    localStorage.removeItem('access_token');
    navigate('/', { replace: true });
  };

  return (
    <header className="top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="font-semibold text-gray-800 dark:text-gray-100">QueryBill</div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
          <div className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">U</div>
            <span className="text-sm">User</span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm rounded-md bg-red-50 hover:bg-red-100 text-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar


