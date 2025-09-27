import React from 'react';

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

const Toggle: React.FC<ToggleProps> = ({ label, description, ...props }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-grow">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <label htmlFor={props.name} className="relative inline-flex items-center cursor-pointer ml-4">
        <input type="checkbox" className="sr-only peer" {...props} />
        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-tmobile-magenta dark:peer-focus:ring-offset-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tmobile-magenta"></div>
      </label>
    </div>
  );
};

export default Toggle;