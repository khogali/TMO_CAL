
import React, { useMemo, useState } from 'react';
import { SavedLead, LeadStatus } from '../types';
import { useAuth, useData, useUI } from '../context/AppContext';

import DashboardStats from './home/DashboardStats';
import RecentQuotes from './home/RecentQuotes';
import AISalesCoachModal from './home/AISalesCoachModal';
import MobileAppShell from './ui/MobileAppShell';
import Button from './ui/Button';

export const HomePage: React.FC = () => {
  const { user, userProfile, setIsAuthModalOpen } = useAuth();
  const { 
    visibleLeads, 
    setLeadToView,
  } = useData();
  const { setView } = useUI();
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);

  const myLeads = useMemo(() => {
    if (!user) return [];
    return visibleLeads.filter(lead => lead.assignedToUid === user.uid);
  }, [visibleLeads, user]);

  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return 'Expert';
    return fullName.split(' ')[0];
  };

  const firstName = user ? getFirstName(userProfile?.displayName) : 'Guest';
  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';

  const handleLoadLead = (lead: SavedLead) => {
    setLeadToView(lead.id);
    setView('leads');
  };

  return (
    <MobileAppShell>
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-40 pt-6 font-display">
            
            {/* Greeting */}
            <div className="pt-2 pb-6">
                <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold tracking-tight">
                    {greeting},<br/><span className="text-primary">{firstName}</span>
                </h1>
            </div>

            {/* Stats Cards */}
            {user ? (
                <>
                    <DashboardStats leads={myLeads} />
                    <RecentQuotes 
                        leads={myLeads} 
                        onViewAll={() => setView('leads')}
                        onSelectLead={handleLoadLead}
                    />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to your account</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">Access your dashboard, manage leads, and track your performance.</p>
                    </div>
                    <Button onClick={() => setIsAuthModalOpen(true)} className="w-full max-w-xs font-bold shadow-lg shadow-primary/20">
                        Sign In
                    </Button>
                </div>
            )}

            {/* Spacer for FAB */}
            <div className="h-24"></div>
        </div>

        {/* FAB */}
        <div className="absolute bottom-24 right-4 z-20">
            <button 
                onClick={() => setView('new-quote')}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-4 rounded-full shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="font-bold text-sm">New Quote</span>
            </button>
        </div>

        <AISalesCoachModal isOpen={isCoachModalOpen} onClose={() => setIsCoachModalOpen(false)} />
    </MobileAppShell>
  );
};
