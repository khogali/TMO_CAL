import React from 'react';

interface DiscountOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
}

const DiscountOption: React.FC<DiscountOptionProps> = ({ icon, label, description, checked, onChange, name }) => {
  const anId = React.useId();
  return (
    <label
      htmlFor={anId}
      className={`
        flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${checked
          ? 'bg-tmobile-magenta/10 border-tmobile-magenta dark:bg-tmobile-magenta/20'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
        }
      `}
    >
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 mr-4">
        <span className={`w-6 h-6 ${checked ? 'text-tmobile-magenta' : 'text-slate-500 dark:text-slate-400'}`}>
          {icon}
        </span>
      </div>
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{label}</p>
          {checked && (
            <span className="text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 py-0.5 px-2 rounded-full animate-fade-in-down">
                Active
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="ml-4 flex-shrink-0">
        <div className="relative inline-flex items-center cursor-pointer">
          <input
            id={anId}
            type="checkbox"
            className="sr-only peer"
            name={name}
            checked={checked}
            onChange={onChange}
          />
          <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-tmobile-magenta dark:peer-focus:ring-offset-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tmobile-magenta"></div>
        </div>
      </div>
    </label>
  );
};

export default DiscountOption;
