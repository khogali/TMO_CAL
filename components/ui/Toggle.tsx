import React from 'react';

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

const Toggle: React.FC<ToggleProps> = ({ label, description, checked, ...props }) => {
  const anId = React.useId();
  return (
    <div className="flex items-center justify-between">
      <div className="flex-grow pr-4">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <label htmlFor={anId} className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
        <input type="checkbox" id={anId} className="sr-only peer" checked={checked} {...props} />
        <div className={`w-12 h-7 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 peer-focus:ring-offset-card ${checked ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </label>
    </div>
  );
};

export default Toggle;