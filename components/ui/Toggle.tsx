import React from 'react';
import { useHaptics } from '../../hooks/useHaptics';

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

const Toggle: React.FC<ToggleProps> = ({ label, description, checked, onChange, ...props }) => {
  const anId = React.useId();
  const { triggerHaptic } = useHaptics();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    triggerHaptic('light');
    onChange?.(e);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex-grow pr-4">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <label htmlFor={anId} className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
        <input type="checkbox" id={anId} className="sr-only peer" checked={checked} onChange={handleChange} {...props} />
        <div className={`w-10 h-6 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-focus:ring-offset-card ${checked ? 'bg-primary' : 'bg-input'}`}></div>
        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform transform shadow ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </label>
    </div>
  );
};

export default Toggle;