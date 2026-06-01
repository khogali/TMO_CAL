
import React from 'react';
import { useUI, useAuth } from '../../context/AppContext';

const ActionButton: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
    gradient: string;
}> = ({ icon, title, subtitle, onClick, gradient }) => (
    <button 
        onClick={onClick}
        className={`group relative flex flex-col justify-between p-5 h-36 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden text-left border border-white/10 ${gradient}`}
    >
        <div className="relative z-10 flex justify-between items-start w-full">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm text-white">
                {icon}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white/80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
        
        <div className="relative z-10">
            <h3 className="font-bold text-lg text-white leading-tight">{title}</h3>
            <p className="text-xs text-white/70 mt-1 font-medium">{subtitle}</p>
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
);

const HomeActions: React.FC = () => {
    const { setView } = useUI();
    const { user } = useAuth();

    return (
        <div className="grid grid-cols-2 gap-4">
            <ActionButton
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>}
                title="Magic Quote"
                subtitle="Guided Wizard"
                onClick={() => setView('wizard')}
                gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
            />
            <ActionButton
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25h2.25A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 6V6zM13.5 15.75a2.25 2.25 0 012.25-2.25h2.25A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>}
                title="Custom"
                subtitle="Full Calculator"
                onClick={() => setView('new-quote')}
                gradient="bg-gradient-to-br from-pink-500 to-rose-500"
            />
            {user && (
                <>
                <ActionButton
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
                    title="Leads"
                    subtitle="Manage Pipeline"
                    onClick={() => setView('leads')}
                    gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
                />
                <ActionButton
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>}
                    title="Rate Plans"
                    subtitle="Price Grid"
                    onClick={() => setView('plans')}
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                />
                <ActionButton
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-1.294-1.579 6.721 6.721 0 01-1.294 1.579 2.25 2.25 0 01-1.854.912h-1.11a2.25 2.25 0 01-2.25-2.25v-2.029a2.25 2.25 0 012.25-2.25h1.11c.913 0 1.763.351 2.392.928a2.259 2.259 0 011.83.928 2.26 2.26 0 011.831-.928c.629-.577 1.479-.928 2.392-.928h1.11a2.25 2.25 0 012.25 2.25v2.03a2.25 2.25 0 01-2.25 2.25h-1.11a2.25 2.25 0 01-1.854-.913z" /></svg>}
                    title="Profile"
                    subtitle="Stats & Settings"
                    onClick={() => setView('profile')}
                    gradient="bg-gradient-to-br from-slate-600 to-slate-800"
                />
                </>
            )}
        </div>
    );
}

export default HomeActions;
