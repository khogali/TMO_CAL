import React from 'react';

interface ButtonGroupProps {
  label?: string;
  name: string;
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (name: string, value: string) => void;
  className?: string;
  size?: 'default' | 'sm';
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ label, name, value, options, onChange, className = 'grid-cols-3', size = 'default' }) => {
  const sizeClasses = size === 'sm' ? 'h-9 px-2 text-xs' : 'h-10 px-2 text-sm';
  
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          {label}
        </label>
      )}
      <div className={`grid ${className} gap-2`}>
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => !option.disabled && onChange(name, option.value)}
            disabled={option.disabled}
            className={`
              ${sizeClasses} rounded-md font-semibold transition-colors duration-200 text-center
              focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              whitespace-nowrap
              ${
                option.disabled
                  ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                  : value === option.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-foreground hover:bg-border'
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