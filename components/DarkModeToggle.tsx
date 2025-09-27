
import React from 'react';

interface DarkModeToggleProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ isDarkMode, setIsDarkMode }) => {
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <button
      onClick={toggleDarkMode}
      className="relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tmobile-magenta dark:focus:ring-offset-slate-900"
    >
      <span className="sr-only">Toggle dark mode</span>
      <span
        className={`${
          isDarkMode ? 'bg-tmobile-magenta' : 'bg-slate-300'
        } inline-block w-11 h-6 rounded-full transition-colors ease-in-out duration-200`}
      ></span>
      <span
        className={`${
          isDarkMode ? 'translate-x-6' : 'translate-x-1'
        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform ease-in-out duration-200`}
      ></span>
    </button>
  );
};

export default DarkModeToggle;
