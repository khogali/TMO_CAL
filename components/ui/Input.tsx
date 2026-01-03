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
    // Sync internal state if the external prop changes
    setInternalValue(value);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === 'number' && Number(e.target.value) === 0) {
      setInternalValue('');
    }
    // Propagate the original event if a handler is provided
    onFocus?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    // Propagate the event to the parent component's handler
    onChange?.(e);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === 'number' && e.target.value === '') {
      // If the field is empty, treat it as 0
      setInternalValue('0');
      // Create a synthetic event that looks like the real one, but with the value '0'.
      // Spreading e.target (a DOM node) is unreliable and doesn't copy properties like 'name'.
      // We must reconstruct the target object for the parent's onChange handler.
      const syntheticEvent = {
        ...e, // Keep original event properties like timestamps
        target: {
          name: name, // Pass the component's name prop
          value: '0',
          valueAsNumber: 0, // Ensure valueAsNumber is also set for numeric inputs
          type: type, // Pass the component's type prop
          checked: e.target.checked,
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      // Propagate the change event with the new value '0'
      onChange?.(syntheticEvent);
    }
    // Propagate the original blur event
    onBlur?.(e);
  };

  return (
    <div>
      <label htmlFor={anId} className="block text-sm font-medium text-muted-foreground mb-2">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-muted-foreground sm:text-sm">{prefix}</span>
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
            flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
            file:border-0 file:bg-transparent file:text-sm file:font-medium 
            placeholder:text-muted-foreground 
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
            disabled:cursor-not-allowed disabled:opacity-50
            ${prefix ? 'pl-7' : ''}
            ${suffix ? 'pr-12' : ''}
          `}
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-muted-foreground sm:text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
