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
        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-start sm:items-center justify-between gap-4
        ${checked
          ? 'bg-primary/10 border-primary'
          : 'bg-muted border-transparent hover:border-border'
        }
      `}
    >
      <div className="flex items-start sm:items-center gap-4">
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg ${checked ? 'bg-primary/20' : 'bg-card'}`}>
          <span className={`w-6 h-6 ${checked ? 'text-primary' : 'text-muted-foreground'}`}>
            {icon}
          </span>
        </div>
        <div className="flex-grow">
          <div className="flex items-center flex-wrap gap-x-2">
            <p className="font-semibold text-foreground">{label}</p>
            {checked && (
              <span className="text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 py-0.5 px-2 rounded-full animate-fade-in-down">
                  Active
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="ml-auto flex-shrink-0 self-center">
        <div className="relative inline-flex items-center cursor-pointer">
          <input
            id={anId}
            type="checkbox"
            className="sr-only peer"
            name={name}
            checked={checked}
            onChange={onChange}
          />
           <div className={`w-10 h-6 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-focus:ring-offset-card ${checked ? 'bg-primary' : 'bg-input'}`}></div>
          <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform transform shadow ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
        </div>
      </div>
    </label>
  );
};

export default DiscountOption;
