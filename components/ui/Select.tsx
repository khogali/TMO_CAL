
import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  name: string;
  options: SelectOption[];
  value: string;
  onChange: (name: string, value: string) => void;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ label, name, options, value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    setIsOpen(false);
    onChange(name, optionValue);
  };
  
  const selectControl = (
     <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full cursor-default rounded-2xl border-0 bg-muted/50 py-3 pl-4 pr-10 text-left transition-all h-12 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:shadow-lg ${isOpen ? 'bg-background ring-2 ring-primary/20' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate text-foreground font-medium">{selectedOption?.label}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <svg className={`h-5 w-5 text-muted-foreground transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul
          className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-card/90 backdrop-blur-xl py-2 shadow-xl border border-white/10 ring-1 ring-black/5 focus:outline-none text-base"
          tabIndex={-1}
          role="listbox"
          aria-label={label}
        >
          {options.map(option => (
            <li
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="relative group cursor-pointer select-none py-2.5 pl-4 pr-10 text-foreground mx-2 rounded-xl hover:bg-primary/10 transition-colors"
              role="option"
              aria-selected={option.value === value}
            >
              <span className={`block truncate ${option.value === value ? 'font-bold text-primary' : 'font-normal'}`}>
                {option.label}
              </span>
              {option.value === value && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className={className || ''}>
      {label && (
        <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider pl-1">
          {label}
        </label>
      )}
      {selectControl}
    </div>
  );
};

export default Select;
