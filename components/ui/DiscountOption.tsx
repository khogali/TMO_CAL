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
        flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${checked
          ? 'bg-primary/10 border-primary'
          : 'bg-muted border-transparent hover:border-border'
        }
      `}
    >
      <div className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-lg mr-4 ${checked ? 'bg-primary/20' : 'bg-card'}`}>
        <span className={`w-6 h-6 ${checked ? 'text-primary' : 'text-muted-foreground'}`}>
          {icon}
        </span>
      </div>
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-foreground">{label}</p>
          {checked && (
            <span className="text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 py-0.5 px-2 rounded-full animate-fade-in-down">
                Active
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
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
           <div className={`w-12 h-7 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 peer-focus:ring-offset-card ${checked ? 'bg-primary' : 'bg-border'}`}></div>
          <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
      </div>
    </label>
  );
};

export default DiscountOption;