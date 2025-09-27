import React, { useState, useEffect, useRef } from 'react';
import Input from './ui/Input';

interface PasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ADMIN_PASSWORD = '123456';

const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700"
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Admin Access</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input 
            label="Enter Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => {
                setPassword(e.target.value);
                setError('');
            }}
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-tmobile-magenta text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tmobile-magenta dark:focus:ring-offset-slate-800 transition-colors duration-200"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;