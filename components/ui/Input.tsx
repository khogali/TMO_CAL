import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  prefix?: string;
  suffix?: string;
}

const Input: React.FC<InputProps> = ({ label, prefix, suffix, ...props }) => {
  return (
    <div>
      <label htmlFor={props.name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative">
        {prefix && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{prefix}</span>
            </div>
        )}
        <input
          {...props}
          className={`block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm focus:border-tmobile-magenta focus:ring-tmobile-magenta sm:text-sm h-[42px] ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-7' : 'pr-3'}`}
        />
         {suffix && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{suffix}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default Input;