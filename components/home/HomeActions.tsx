
import React from 'react';
import { useUI, useAuth } from '../../context/AppContext';

const ActionButton: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onClick: () => void;
    colorClass: string;
}> = ({ icon, title, subtitle, onClick, colorClass }) => (
    <button 
        onClick={onClick}
        className="group relative flex flex-col items-start justify-between p-6 h-44 w-full rounded-[2.5rem] glass shadow-soft hover:shadow-soft-lg hover:border-primary/30 transition-all duration-300 overflow-hidden text-left"
    >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 duration-300 ${colorClass}`}>
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors tracking-tight">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground mt-1 font-medium">{subtitle}</p>}
        </div>
        <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground -translate-x-2 group-hover:translate-x-0 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
        </div>
    </button>
);

const HomeActions: React.FC = () => {
    const { setView, setIsWizardMode } = useUI();
    const { user } = useAuth();

    const handleMagicQuote = () => {
        setIsWizardMode(true);
        setView('new-quote');
    };

    const handleCustomQuote = () => {
        setIsWizardMode(false);
        setView('new-quote');
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <ActionButton
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                    title="Magic Quote"
                    subtitle="Wizard builder"
                    onClick={handleMagicQuote}
                    colorClass="bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                />
                <ActionButton
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
                    title="Custom Quote"
                    subtitle="Full control"
                    onClick={handleCustomQuote}
                    colorClass="bg-primary/10 text-primary"
                />
                {user && (
                    <ActionButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                        title="Leads"
                        subtitle="Manage pipeline"
                        onClick={() => setView('leads')}
                        colorClass="bg-blue-500/10 text-blue-600"
                    />
                )}
                 {user && (
                    <ActionButton
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                        title="Profile"
                        subtitle="Your stats"
                        onClick={() => setView('profile')}
                        colorClass="bg-purple-500/10 text-purple-600"
                    />
                )}
            </div>
        </div>
    );
}

export default HomeActions;
