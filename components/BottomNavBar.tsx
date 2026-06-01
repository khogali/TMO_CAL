
import React from 'react';
import { useAuth, useUI } from '../context/AppContext';
import { useHaptics } from '../hooks/useHaptics';

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isMainAction?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, activeIcon, isActive, onClick, isMainAction }) => {
    const { triggerHaptic } = useHaptics();

    const handleClick = () => {
        triggerHaptic(isMainAction ? 'medium' : 'light');
        onClick();
    };

    if (isMainAction) {
        return (
            <button
                onClick={handleClick}
                className={`
                    relative flex items-center justify-center h-12 w-12 rounded-full transition-all duration-300 mx-1
                    ${isActive 
                        ? 'bg-gradient-to-r from-primary to-pink-600 text-white shadow-lg shadow-primary/40 scale-110' 
                        : 'bg-primary/90 text-white hover:bg-primary shadow-md hover:scale-105'
                    }
                `}
                aria-label={label}
            >
                {/* Pulse Ring if active */}
                {isActive && <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />}
                
                <div className={`transition-transform duration-300 ${isActive ? 'rotate-90' : 'rotate-0'}`}>
                    {isActive ? activeIcon : icon}
                </div>
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`
                flex items-center justify-center h-12 rounded-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
                ${isActive 
                    ? 'flex-[2.5] bg-white/15 text-white px-4 gap-2' 
                    : 'flex-1 text-white/40 hover:text-white/70 w-12'
                }
            `}
            aria-label={label}
        >
            <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                {isActive ? activeIcon : icon}
            </div>
            
            <span 
                className={`
                    text-[11px] font-bold tracking-wide whitespace-nowrap transition-all duration-500
                    ${isActive ? 'opacity-100 translate-x-0 max-w-[100px]' : 'opacity-0 translate-x-4 max-w-0 hidden'}
                `}
            >
                {label}
            </span>
        </button>
    );
};

const BottomNavBar: React.FC = () => {
  const { view: currentView, setView } = useUI();
  const { user, setIsAuthModalOpen } = useAuth();
  
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center lg:hidden pointer-events-none">
        {/* Floating Capsule Container */}
        <nav className="pointer-events-auto bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-1.5 flex items-center gap-1 transition-all duration-300 max-w-[95vw]">
            
            <NavItem
                label="Home"
                isActive={currentView === 'home'}
                onClick={() => setView('home')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>}
                activeIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>}
            />
            
            <NavItem
                label="Promos"
                isActive={currentView === 'promotions'}
                onClick={() => setView('promotions')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>}
                activeIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" /></svg>}
            />

            {/* Central Action Button */}
            <NavItem
                label="Quote"
                isActive={currentView === 'new-quote' || currentView === 'wizard'}
                onClick={() => setView('new-quote')}
                isMainAction={true}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
                activeIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>} 
            />

            {user ? (
                <NavItem
                    label="Leads"
                    isActive={currentView === 'leads'}
                    onClick={() => setView('leads')}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
                    activeIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>}
                />
            ) : (
                <NavItem
                    label="Plans"
                    isActive={currentView === 'plans'}
                    onClick={() => setView('plans')}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>}
                    activeIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M3 3a1.5 1.5 0 00-1.5 1.5v15A1.5 1.5 0 003 21h18a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0021 3H3zm4.5 6a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H8.25a.75.75 0 01-.75-.75V9zm0 3a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H8.25a.75.75 0 01-.75-.75V12zm0 3a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H8.25a.75.75 0 01-.75-.75V15zm3-6.75A.75.75 0 0111.25 9h4.5a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75V8.25zm0 3a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75V11.25zm0 3a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75V14.25z" clipRule="evenodd" /></svg>}
                />
            )}

            <NavItem
                label={user ? "Profile" : "Sign In"}
                isActive={currentView === 'profile'}
                onClick={() => user ? setView('profile') : setIsAuthModalOpen(true)}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12" /></svg>}
                activeIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M15.75 2.25H8.25a2.25 2.25 0 00-2.25 2.25v15a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 19.5V4.5a2.25 2.25 0 00-2.25-2.25zM6 19.5v-15C6 3.672 7.007 3 8.25 3h7.5c1.243 0 2.25.672 2.25 1.5v15c0 .828-1.007 1.5-2.25 1.5h-7.5C7.007 21 6 20.328 6 19.5zM12 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" /></svg>}
            />
        </nav>
    </div>
  );
};

export default BottomNavBar;
