
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
import Toast from './components/ui/Toast';
import Button from './components/ui/Button';
import PageTransition from './components/ui/PageTransition';
import UserInfoModal from './components/UserInfoModal';

// --- Components ---

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
        <span className={`${isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`}>{icon}</span>
        <span className="font-semibold text-sm">{label}</span>
    </button>
);

const Sidebar: React.FC = () => {
    const { view, setView, setIsWizardMode } = useUI();
    const { user, setIsAuthModalOpen } = useAuth();

    const handleNav = (newView: typeof view) => {
        setIsWizardMode(false);
        setView(newView);
    };

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-full flex-shrink-0 z-20">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">T</div>
                <span className="font-bold text-lg tracking-tight">T-Quote</span>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                <NavItem label="Dashboard" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} isActive={view === 'home'} onClick={() => handleNav('home')} />
                <NavItem label="Smart Quote" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} isActive={view === 'new-quote'} onClick={() => handleNav('new-quote')} />
                <NavItem label="Promotions" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>} isActive={view === 'promotions'} onClick={() => handleNav('promotions')} />
                {user && <NavItem label="Leads" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} isActive={view === 'leads'} onClick={() => handleNav('leads')} />}
            </nav>

            <div className="p-4 border-t border-border">
                {user ? (
                    <button onClick={() => handleNav('profile')} className="flex items-center gap-3 w-full p-2 hover:bg-muted rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left overflow-hidden">
                            <p className="text-sm font-bold truncate">{user.displayName || 'Rep'}</p>
                            <p className="text-xs text-muted-foreground truncate">View Profile</p>
                        </div>
                    </button>
                ) : (
                    <Button onClick={() => setIsAuthModalOpen(true)} className="w-full">Sign In</Button>
                )}
            </div>
        </aside>
    );
};

const Header: React.FC = () => {
    const { user, userProfile, isAdmin, setIsAuthModalOpen } = useAuth();
    const { allStores } = useData();
    const { setIsPasswordModalOpen, setView } = useUI();
    
    const currentStore = userProfile?.storeId ? allStores.find(s => s.id === userProfile.storeId) : null;

    return (
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-2 lg:hidden">
                <button onClick={() => setView('home')} className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">T</button>
            </div>

            <div className="hidden lg:block font-semibold text-foreground">
                {currentStore ? <span className="flex items-center gap-2"><svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{currentStore.name}</span> : 'Sales Center'}
            </div>

            <div className="flex items-center gap-3">
                <ConnectedDarkModeToggle />
                {isAdmin && (
                    <button onClick={() => setIsPasswordModalOpen(true)} className="p-2 hover:bg-muted rounded-full text-muted-foreground">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                )}
                <div className="lg:hidden">
                    {user ? (
                        <button onClick={() => setView('profile')} className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">{user.email?.charAt(0).toUpperCase()}</button>
                    ) : (
                        <Button size="sm" onClick={() => setIsAuthModalOpen(true)}>Sign In</Button>
                    )}
                </div>
            </div>
        </header>
    );
};

const App: React.FC = () => {
    const { view, isPasswordModalOpen, isAdminPanelOpen, toastMessage, setIsPasswordModalOpen, setIsAdminPanelOpen, setToastMessage, isWizardMode } = useUI();
    const { isAuthModalOpen, setIsAuthModalOpen, isUserInfoModalOpen, setIsUserInfoModalOpen } = useAuth();

    return (
        <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden">
            <Sidebar />
            
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {!isWizardMode && <Header />}
                
                {/* Main scroll container. Individual pages are responsible for their internal structure. */}
                <main className="flex-1 w-full h-full relative overflow-hidden bg-muted/20">
                    <PageTransition view={view}>
                        {view === 'home' && <div className="h-full overflow-y-auto pb-24"><HomePage /></div>}
                        {view === 'new-quote' && <LeadCalculator />}
                        {view === 'leads' && <div className="h-full overflow-y-auto pb-24"><LeadsPortal /></div>}
                        {view === 'profile' && <div className="h-full overflow-y-auto pb-24"><ProfilePage /></div>}
                        {view === 'promotions' && <div className="h-full overflow-y-auto pb-24"><PromotionsPage /></div>}
                    </PageTransition>
                </main>
                
                <BottomNavBar />
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

const ConnectedDarkModeToggle = () => {
    const { isDarkMode, setIsDarkMode } = useUI();
    return <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
};

export default App;
