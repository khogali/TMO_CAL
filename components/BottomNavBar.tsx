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
                relative flex flex-col items-center justify-center w-14 h-12 transition-all duration-300 group select-none rounded-full
                ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
            `}
        >
            {/* Active Indicator Background Pill - Floating behind */}
            <div className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full transition-all duration-300 -z-10
                ${isActive ? 'bg-primary/10 scale-100 opacity-100' : 'scale-50 opacity-0'}
            `}></div>

            {/* Icon Container */}
            <div className={`
                transition-transform duration-300 flex items-center justify-center
                ${isActive ? 'scale-110 -translate-y-1' : 'group-active:scale-95'}
                ${isPrimary && !isActive ? 'text-foreground' : ''}
            `}>
                {icon}
            </div>

            {/* Label - Tiny and only visible when active to keep the island clean */}
            <span className={`
                text-[9px] font-bold mt-0.5 tracking-tight transition-all duration-300 absolute -bottom-1.5 whitespace-nowrap
                ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}>
                {label}
            </span>
        </button>
    );
};

const BottomNavBar: React.FC = () => {
  const { view: currentView, setView } = useUI();
  const { user, setIsAuthModalOpen } = useAuth();
  
  return (
    // Container: Fixed at bottom, handles safe area spacing, lets clicks pass through. z-40 to sit below modals (z-50)
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none flex justify-center pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:hidden">
        {/* The Island: Catches clicks, glassmorphic styling */}
        <nav className="pointer-events-auto bg-background/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-4 py-2 flex items-center gap-1 sm:gap-2 max-w-[95vw] transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5">
            <NavItem
                label="Home"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={currentView === 'home' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={currentView === 'home' ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                isActive={currentView === 'home'}
                onClick={() => setView('home')}
            />
            
            <NavItem
                label="Promos"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={currentView === 'promotions' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={currentView === 'promotions' ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h1.125c.621 0 1.129-.504 1.09-1.124a6.75 6.75 0 0114.82 0c-.04.62.468 1.124 1.09 1.124H21a.75.75 0 01.75.75v5.69l-4.197-.96a.75.75 0 00-.552.05l-4.251 1.7a.75.75 0 01-.552 0l-4.25-1.7a.75.75 0 00-.553-.05L2.25 17.69v-5.69a.75.75 0 01.75-.75z" /></svg>}
                isActive={currentView === 'promotions'}
                onClick={() => setView('promotions')}
            />

            <NavItem
                label="Quote"
                isPrimary
                icon={
                    <div className={`${currentView === 'new-quote' ? '' : 'bg-primary/10 text-primary p-2.5 rounded-full'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </div>
                }
                isActive={currentView === 'new-quote'}
                onClick={() => setView('new-quote')}
            />

            {user && (
                 <NavItem
                    label="Leads"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={currentView === 'leads' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={currentView === 'leads' ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    isActive={currentView === 'leads'}
                    onClick={() => setView('leads')}
                />
            )}

            <NavItem
                label={user ? "Profile" : "Sign In"}
                icon={user ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={currentView === 'profile' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={currentView === 'profile' ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12" /></svg>
                )}
                isActive={currentView === 'profile'}
                onClick={() => user ? setView('profile') : setIsAuthModalOpen(true)}
            />
        </nav>
    </div>
  );
};

export default BottomNavBar;