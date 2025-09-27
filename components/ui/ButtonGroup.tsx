import React from 'react';

interface ButtonGroupProps {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (name: string, value: string) => void;
  className?: string;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ label, name, value, options, onChange, className = 'grid-cols-3' }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      <div className={`grid ${className} gap-2`}>
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(name, option.value)}
            className={`
              py-2 px-2 rounded-md text-sm font-semibold transition-colors duration-200 text-center
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tmobile-magenta dark:focus:ring-offset-slate-800
              whitespace-nowrap
              ${value === option.value
                ? 'bg-tmobile-magenta text-white shadow-md'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ButtonGroup;
