import React from 'react';

interface ButtonGroupProps {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (name: string, value: string) => void;
  className?: string;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ label, name, value, options, onChange, className = 'grid-cols-3' }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground mb-2">
        {label}
      </label>
      <div className={`grid ${className} gap-2`}>
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(name, option.value)}
            disabled={option.disabled}
            className={`
              h-12 px-2 rounded-xl text-sm font-semibold transition-colors duration-200 text-center
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-card
              whitespace-nowrap
              ${value === option.value
                ? 'bg-primary text-white shadow-soft'
                : 'bg-muted text-foreground hover:bg-border'
              }
              ${option.disabled ? 'opacity-50 cursor-not-allowed hover:bg-muted' : ''}
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