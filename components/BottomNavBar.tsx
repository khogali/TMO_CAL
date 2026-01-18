
import React from 'react';
import { useAuth, useUI } from '../context/AppContext';
import { useHaptics } from '../hooks/useHaptics';

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isPrimary?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick, isPrimary }) => {
    const { triggerHaptic } = useHaptics();

    const handleClick = () => {
        triggerHaptic('light');
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            className={`
                relative flex flex-col items-center justify-center h-full flex-1 transition-all duration-300 group select-none
                ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80'}
            `}
        >
            {/* Active Glow for non-primary */}
            {!isPrimary && isActive && (
                <div className="absolute inset-0 bg-white/10 rounded-xl blur-lg scale-75 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            )}

            {/* Icon Container */}
            <div className={`
                relative transition-all duration-300 flex items-center justify-center p-2 rounded-2xl
                ${isActive ? 'scale-110 -translate-y-1' : 'group-active:scale-95'}
                ${isPrimary 
                    ? `w-14 h-14 -mt-8 bg-gradient-to-br from-primary to-pink-600 text-white shadow-lg shadow-primary/40 ring-4 ring-[#1c1c1e] ${isActive ? 'scale-110' : ''}` 
                    : ''}
            `}>
                {icon}
            </div>

            {/* Label */}
            {!isPrimary && (
                <span className={`
                    text-[9px] font-bold mt-1 tracking-tight transition-all duration-300 absolute -bottom-2 whitespace-nowrap
                    ${isActive ? 'opacity-100 translate-y-0 text-white' : 'opacity-0 translate-y-1'}
                `}>
                    {label}
                </span>
            )}
        </button>
    );
};

const BottomNavBar: React.FC = () => {
  const { view: currentView, setView, isWizardMode, setIsWizardMode } = useUI();
  const { user, setIsAuthModalOpen } = useAuth();
  
  // Hide bottom navigation in Wizard mode to prevent overlap with the Wizard's own action bar
  if (isWizardMode) return null;

  const handleNav = (view: typeof currentView) => {
      setIsWizardMode(false); // Ensure we exit wizard mode when navigating via dock
      setView(view);
  };

  const handleAuth = () => {
      setIsWizardMode(false);
      setIsAuthModalOpen(true);
  };

  return (
    // Container: Fixed at bottom, floating above content
    <div className="fixed inset-x-0 bottom-6 z-40 lg:hidden pointer-events-none flex justify-center px-4">
        
        {/* Floating Glass Dock */}
        <nav className="pointer-events-auto bg-[#1c1c1e]/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] rounded-[2.5rem] px-6 h-[4.5rem] w-full max-w-sm flex items-center justify-between transition-all duration-300 ring-1 ring-black/20">
            <NavItem
                label="Home"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill={currentView === 'home' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={currentView === 'home' ? 0 : 2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                isActive={currentView === 'home'}
                onClick={() => handleNav('home')}
            />
            
            <NavItem
                label="Promos"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill={currentView === 'promotions' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={currentView === 'promotions' ? 0 : 2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h1.125c.621 0 1.129-.504 1.09-1.124a6.75 6.75 0 0114.82 0c-.04.62.468 1.124 1.09 1.124H21a.75.75 0 01.75.75v5.69l-4.197-.96a.75.75 0 00-.552.05l-4.251 1.7a.75.75 0 01-.552 0l-4.25-1.7a.75.75 0 00-.553-.05L2.25 17.69v-5.69a.75.75 0 01.75-.75z" /></svg>}
                isActive={currentView === 'promotions'}
                onClick={() => handleNav('promotions')}
            />

            <NavItem
                label="Quote"
                isPrimary
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
                isActive={currentView === 'new-quote'}
                onClick={() => handleNav('new-quote')}
            />

            {user && (
                    <NavItem
                    label="Leads"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill={currentView === 'leads' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={currentView === 'leads' ? 0 : 2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    isActive={currentView === 'leads'}
                    onClick={() => handleNav('leads')}
                />
            )}

            <NavItem
                label={user ? "Profile" : "Sign In"}
                icon={user ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill={currentView === 'profile' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={currentView === 'profile' ? 0 : 2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12" /></svg>
                )}
                isActive={currentView === 'profile'}
                onClick={() => user ? handleNav('profile') : handleAuth()}
            />
        </nav>
    </div>
  );
};

export default BottomNavBar;
