
import React from 'react';
import { User } from 'firebase/auth';

interface BottomNavBarProps {
  onOpenLeads: () => void;
  onOpenAdmin: () => void;
  onOpenUserInfo: () => void;
  isAdmin: boolean;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

const NavButton: React.FC<{onClick: () => void; label: string; 'aria-label': string; children: React.ReactNode}> = ({ onClick, label, 'aria-label': ariaLabel, children }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors w-full h-full space-y-1 focus:outline-none focus:text-primary"
        aria-label={ariaLabel}
    >
        {children}
        <span className="text-xs font-medium">{label}</span>
    </button>
);


const BottomNavBar: React.FC<BottomNavBarProps> = ({ onOpenLeads, onOpenAdmin, onOpenUserInfo, isAdmin, user, onSignIn, onSignOut }) => {
  return (
    <footer className="md:hidden fixed bottom-4 left-4 right-4 bg-card/80 backdrop-blur-xl border border-border rounded-3xl z-40 shadow-soft-lg animate-slide-up">
      <nav className="flex justify-around items-center h-20">
        <NavButton onClick={onOpenLeads} label="Leads" aria-label="Open Leads Panel">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </NavButton>

        {isAdmin && (
          <NavButton onClick={onOpenAdmin} label="Admin" aria-label="Open Admin Panel">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </NavButton>
        )}
        
        {user ? (
            <>
                <NavButton onClick={onOpenUserInfo} label="Profile" aria-label="Open User Profile">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </NavButton>
                <NavButton onClick={onSignOut} label="Sign Out" aria-label="Sign Out">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </NavButton>
            </>
        ) : (
             <NavButton onClick={onSignIn} label="Sign In" aria-label="Sign In">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </NavButton>
        )}
      </nav>
    </footer>
  );
};

export default BottomNavBar;