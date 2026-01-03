
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AppContext';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';

const AuthModal: React.FC = () => {
  const {
    isSignUp,
    setIsSignUp,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authError,
    authLoading,
    handleAuth,
    isAuthModalOpen,
    setIsAuthModalOpen
  } = useAuth();

  const [localError, setLocalError] = useState<string | null>(null);

  // Sync global error state to local state
  useEffect(() => {
    if (authError) setLocalError(authError);
  }, [authError]);

  // Clear errors when modal opens or switches mode
  useEffect(() => {
    if (isAuthModalOpen) {
        setLocalError(null);
    }
  }, [isAuthModalOpen, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!authEmail || !authPassword) {
        setLocalError('Please fill in all fields.');
        return;
    }
    await handleAuth();
  };

  const handleClose = () => {
      // Allow closing even if loading to prevent trapping the user
      setIsAuthModalOpen(false);
  };

  return (
    <Modal isOpen={isAuthModalOpen} onClose={handleClose} className="max-w-sm">
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-foreground">
                    {isSignUp ? 'Create Account' : 'Sign In'}
                </h2>
                <button 
                    onClick={handleClose} 
                    className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    disabled={authLoading}
                />
                <Input
                    label="Password"
                    type="password"
                    name="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    disabled={authLoading}
                />

                {localError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium animate-shake">
                        {localError}
                    </div>
                )}

                <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25" 
                    disabled={authLoading}
                >
                    {authLoading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        isSignUp ? 'Create Account' : 'Sign In'
                    )}
                </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button 
                        onClick={() => { setIsSignUp(!isSignUp); setLocalError(null); }}
                        className="ml-1.5 font-bold text-primary hover:text-primary/80 transition-colors"
                        disabled={authLoading}
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    </Modal>
  );
};

export default AuthModal;
