
import React, { useState, useEffect } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  prefix?: string;
  suffix?: string;
}

const Input: React.FC<InputProps> = ({ label, prefix, suffix, name, value, type, onChange, onFocus, onBlur, ...props }) => {
  const anId = React.useId();
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === 'number' && Number(e.target.value) === 0) {
      setInternalValue('');
    }
    onFocus?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    onChange?.(e);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === 'number' && e.target.value === '') {
      setInternalValue('0');
      const syntheticEvent = {
        ...e,
        target: {
          name: name,
          value: '0',
          valueAsNumber: 0,
          type: type,
          checked: e.target.checked,
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    }
    onBlur?.(e);
  };

  return (
    <div>
      <label htmlFor={anId} className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider pl-1">
        {label}
      </label>
      <div className="relative group">
        {prefix && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <span className="text-muted-foreground font-medium">{prefix}</span>
          </div>
        )}
        <input
          id={anId}
          name={name}
          type={type}
          value={internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
          className={`
            flex h-12 w-full rounded-2xl border-0 bg-muted/50 px-4 py-3 text-base ring-offset-background transition-all
            file:border-0 file:bg-transparent file:text-sm file:font-medium 
            placeholder:text-muted-foreground/70 
            focus:bg-background focus:ring-2 focus:ring-primary/20 focus:shadow-lg
            disabled:cursor-not-allowed disabled:opacity-50
            ${prefix ? 'pl-8' : ''}
            ${suffix ? 'pr-10' : ''}
          `}
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <span className="text-muted-foreground font-medium">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
