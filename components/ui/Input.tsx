import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  prefix?: string;
  suffix?: string;
}

const Input: React.FC<InputProps> = ({ label, prefix, suffix, name, ...props }) => {
  const anId = React.useId();
  return (
    <div>
      <label htmlFor={anId} className="block text-sm font-medium text-muted-foreground mb-2">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <span className="text-muted-foreground sm:text-sm">{prefix}</span>
          </div>
        )}
        <input
          id={anId}
          name={name}
          {...props}
          className={`
            block w-full rounded-xl border border-input bg-card shadow-sm 
            focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 
            sm:text-sm h-12 text-foreground
            ${prefix ? 'pl-8' : 'pl-4'}
            ${suffix ? 'pr-12' : 'pr-4'}
          `}
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <span className="text-muted-foreground sm:text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
