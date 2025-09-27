import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  name: string;
  options: SelectOption[];
  value: string;
  onChange: (name: string, value: string) => void;
}

const Select: React.FC<SelectProps> = ({ label, name, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(option => option.value === value);

  // Close dropdown on outside click
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

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full cursor-default rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 pl-3 pr-10 text-left shadow-sm focus:border-tmobile-magenta focus:outline-none focus:ring-1 focus:ring-tmobile-magenta sm:text-sm h-[42px]"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="block truncate text-slate-800 dark:text-slate-100">{selectedOption?.label}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <ul
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            tabIndex={-1}
            role="listbox"
            aria-label={label}
          >
            {options.map(option => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="relative group cursor-default select-none py-2 pl-3 pr-9 text-slate-900 dark:text-slate-200 hover:bg-tmobile-magenta hover:text-white"
                role="option"
                aria-selected={option.value === value}
              >
                <span className={`block truncate ${option.value === value ? 'font-semibold' : 'font-normal'}`}>
                  {option.label}
                </span>
                {option.value === value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-tmobile-magenta group-hover:text-white">
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
    </div>
  );
};

export default Select;