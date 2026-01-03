import React, { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface PasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ADMIN_PASSWORD = 'admin'; // In a real app, use an environment variable

const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError('Incorrect password.');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-sm bg-card rounded-lg border border-border">
      <div className="p-4 sm:p-5 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-bold text-foreground">Admin Access</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
        <Input
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          type="submit"
          className="w-full"
        >
          Unlock
        </Button>
      </form>
    </Modal>
  );
};

export default PasswordModal;