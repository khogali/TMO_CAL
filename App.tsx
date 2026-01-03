
/* ... existing imports ... */
import React from 'react';
import { useUI, useAuth, useData } from './context/AppContext';
import { HomePage } from './components/HomePage';
import LeadCalculator from './LeadCalculator';
import LeadsPortal from './LeadsPortal';
import ProfilePage from './components/ProfilePage';
import PromotionsPage from './components/PromotionsPage';
import BottomNavBar from './components/BottomNavBar';
import DarkModeToggle from './components/DarkModeToggle';
import AuthModal from './components/AuthModal';
import PasswordModal from './components/PasswordModal';
import AdminPanel from './components/AdminPanel';
import QuoteWizard from './components/QuoteWizard';
import Toast from './components/ui/Toast';
import Button from './components/ui/Button';
import PageTransition from './components/ui/PageTransition';
import UserInfoModal from './components/UserInfoModal';

// --- Sidebar Components ---

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick }) => (
    <Button
        variant={isActive ? 'secondary' : 'ghost'}
        onClick={onClick}
        className={`w-full justify-start text-base h-12 relative overflow-hidden group ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/15' : ''}`}
    >
        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
        <span className={`w-6 h-6 mr-3 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>{icon}</span>
        {label}
    </Button>
);

const Sidebar: React.FC = () => {
    const { view, setView } = useUI();
    const { user, setIsAuthModalOpen } = useAuth();

    return (
        <aside className="hidden lg:flex flex-col w-72 bg-card border-r border-border p-6 space-y-6 flex-shrink-0 z-20 h-full shadow-soft">
            <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => setView('home')}>
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">T-Quote</h1>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sales Center</span>
                </div>
            </div>

            <nav className="flex flex-col gap-2 flex-grow overflow-y-auto no-scrollbar">
                <p className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 mt-2">Menu</p>
                <NavItem label="Dashboard" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25h2.25A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 6V6zM13.5 15.75a2.25 2.25 0 012.25-2.25h2.25A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>} isActive={view === 'home'} onClick={() => setView('home')} />
                <NavItem label="New Quote" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>} isActive={view === 'new-quote'} onClick={() => setView('new-quote')} />
                <NavItem label="Promotions" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h1.125c.621 0 1.129-.504 1.09-1.124a6.75 6.75 0 0114.82 0c-.04.62.468 1.124 1.09 1.124H21a.75.75 0 01.75.75v5.69l-4.197-.96a.75.75 0 00-.552.05l-4.251 1.7a.75.75 0 01-.552 0l-4.25-1.7a.75.75 0 00-.553-.05L2.25 17.69v-5.69a.75.75 0 01.75-.75z" /></svg>} isActive={view === 'promotions'} onClick={() => setView('promotions')} />
                {user && <NavItem label="Leads Portal" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} isActive={view === 'leads'} onClick={() => setView('leads')} />}
            </nav>

            <div className="border-t border-border pt-4 mt-auto space-y-2">
                {user ? (
                    <NavItem label="Profile" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} isActive={view === 'profile'} onClick={() => setView('profile')} />
                ) : (
                    <Button onClick={() => setIsAuthModalOpen(true)} className="w-full font-bold shadow-md">Sign In</Button>
                )}
            </div>
        </aside>
    );
};

const TopHeader: React.FC = () => {
    const { view, setView, setIsPasswordModalOpen } = useUI();
    const { user, userProfile, isAdmin, setIsAuthModalOpen } = useAuth();
    const { allStores } = useData();

    const getTitle = () => {
        switch (view) {
            case 'new-quote': return 'New Quote';
            case 'leads': return 'Leads Portal';
            case 'profile': return 'My Profile';
            case 'promotions': return 'Promotions';
            case 'wizard': return 'Magic Quote';
            default: return 'Dashboard';
        }
    };

    const currentStore = userProfile?.storeId ? allStores.find(s => s.id === userProfile.storeId) : null;

    return (
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border h-16 lg:h-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-200 shadow-sm">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                {/* Mobile Logo/Home */}
                <button 
                    className="lg:hidden flex items-center gap-2 focus:outline-none group" 
                    onClick={() => setView('home')}
                >
                    <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20 group-active:scale-95 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-foreground">T-Quote</span>
                </button>

                {/* Desktop Title & Context */}
                <div className="hidden lg:flex flex-col justify-center">
                    <h2 className="text-xl font-bold text-foreground tracking-tight leading-none mb-1">{getTitle()}</h2>
                    {currentStore ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span>{currentStore.name}</span>
                        </div>
                    ) : (
                        <span className="text-xs font-medium text-muted-foreground">Sales Center</span>
                    )}
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Admin Gear */}
                {isAdmin && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsPasswordModalOpen(true)} 
                        className="text-muted-foreground hover:text-primary transition-colors hidden sm:flex hover:bg-muted/60"
                        title="Admin Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </Button>
                )}
                
                {/* Dark Mode Toggle */}
                <ConnectedDarkModeToggle />

                {/* Divider */}
                <div className="h-8 w-px bg-border/60 mx-1 hidden sm:block"></div>

                {/* User Profile Pill */}
                {user ? (
                    <button 
                        onClick={() => setView('profile')} 
                        className="flex items-center gap-3 p-1 pr-1 sm:pr-4 rounded-full bg-card hover:bg-muted/50 border border-border hover:border-primary/30 transition-all duration-200 group shadow-sm"
                    >
                        <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-pink-600 text-white flex items-center justify-center font-bold text-sm shadow-inner ring-2 ring-background group-hover:ring-primary/20 transition-all">
                                {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
                        </div>
                        
                        <div className="hidden sm:flex flex-col items-start text-left mr-1">
                            <span className="text-sm font-bold text-foreground leading-none group-hover:text-primary transition-colors">
                                {userProfile?.displayName?.split(' ')[0]}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground leading-none mt-1">
                                {userProfile?.role || 'Rep'}
                            </span>
                        </div>
                    </button>
                ) : (
                    <Button 
                        size="sm" 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="shadow-md font-bold rounded-full px-5 bg-primary hover:bg-primary/90 text-white border-0"
                    >
                        Sign In
                    </Button>
                )}
            </div>
        </header>
    );
};

const App: React.FC = () => {
    const { view, isPasswordModalOpen, isAdminPanelOpen, toastMessage, setIsPasswordModalOpen, setIsAdminPanelOpen, setToastMessage } = useUI();
    const { isAuthModalOpen, setIsAuthModalOpen, isUserInfoModalOpen, setIsUserInfoModalOpen } = useAuth();

    return (
        <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
            <Sidebar />
            
            {/* Main Scroll Container */}
            <div className="flex-1 flex flex-col relative w-full overflow-hidden">
                {/* Conditionally render header to allow full-screen wizard experience */}
                {view !== 'wizard' && <TopHeader />}
                
                {/* 
                    FIX: Condition added to padding. 
                    If we are in the 'wizard', we do NOT want the global padding-bottom for the BottomNavBar, 
                    because the wizard has its own sticky/fixed action bar that handles safe areas.
                */}
                <main className={`flex-1 overflow-y-auto scroll-smooth w-full relative ${view === 'wizard' ? 'pb-0' : 'pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0'}`}>
                    <PageTransition view={view}>
                        {view === 'home' && <HomePage />}
                        {view === 'new-quote' && <LeadCalculator />}
                        {view === 'leads' && <LeadsPortal />}
                        {view === 'profile' && <ProfilePage />}
                        {view === 'promotions' && <PromotionsPage />}
                        {view === 'wizard' && <QuoteWizard />}
                    </PageTransition>
                </main>
                
                {/* Hide BottomNavBar when in Wizard mode */}
                {view !== 'wizard' && <BottomNavBar />}
            </div>
            
            {/* Modals */}
            <AuthModal />
            {isPasswordModalOpen && <PasswordModal onClose={() => setIsPasswordModalOpen(false)} onSuccess={() => { setIsPasswordModalOpen(false); setIsAdminPanelOpen(true); }} />}
            {isAdminPanelOpen && <AdminPanel />}
            {isUserInfoModalOpen && <UserInfoModal />} 
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </div>
    );
};

// Helper for DarkModeToggle to use Context
const ConnectedDarkModeToggle = () => {
    const { isDarkMode, setIsDarkMode } = useUI();
    return <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
};

export default App;
