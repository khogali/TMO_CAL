
import React, { useMemo, useState } from 'react';
import { SavedLead, LeadStatus } from '../types';
import { useAuth, useData, useUI } from '../context/AppContext';

import TodaysFollowUps from './home/TodaysFollowUps';
import HomeActions from './home/HomeActions';
import QuickStats from './home/QuickStats';
import PromotionsSpotlight from './home/PromotionsSpotlight';
import AISalesCoachModal from './home/AISalesCoachModal';
import LiveAssistant from './LiveAssistant';
import { Card, CardContent } from './ui/Card';

export const HomePage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { 
    promotions,
    visibleLeads, 
    setLeadToLoad,
    handleUpdateLead,
  } = useData();
  const { setView, setToastMessage } = useUI();
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState(false);

  const myLeads = useMemo(() => {
    if (!user) return [];
    return visibleLeads.filter(lead => lead.assignedToUid === user.uid);
  }, [visibleLeads, user]);

  const spotlightPromotions = useMemo(() => {
    return promotions.filter(p => p.isActive && p.spotlightOnHome);
  }, [promotions]);

  const handleCompleteFollowUp = (leadId: string, status: LeadStatus.CLOSED_WON | LeadStatus.CLOSED_LOST) => {
    handleUpdateLead(leadId, { status, followUpAt: undefined });
    setToastMessage(`Lead marked as ${status}.`);
  };

  const handleRescheduleFollowUp = (leadId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM tomorrow
    handleUpdateLead(leadId, { followUpAt: tomorrow.getTime() });
    setToastMessage('Follow-up rescheduled for tomorrow at 9 AM.');
  };

  const todaysFollowUps = myLeads.filter(lead => {
    if (!lead.followUpAt) return false;
    const now = new Date();
    const followUpDate = new Date(lead.followUpAt);
    return now.getFullYear() === followUpDate.getFullYear() &&
           now.getMonth() === followUpDate.getMonth() &&
           now.getDate() === followUpDate.getDate();
  });
  
  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return null;
    return fullName.split(' ')[0];
  };

  const firstName = getFirstName(userProfile?.displayName);
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleLoadLead = (lead: SavedLead) => {
    setLeadToLoad(lead);
    setView('new-quote');
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Section - Redesigned */}
      <div className="relative bg-gradient-to-br from-[#1c1c1e] to-black text-white pt-8 pb-16 px-6 sm:px-8 lg:px-12 rounded-b-[3rem] shadow-2xl overflow-hidden -mt-1 ring-1 ring-white/5">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none mix-blend-screen"></div>
        
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left z-10">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-pink-200 border border-white/10 mb-4">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    System Online
                </div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-2">
                    {user ? `Hello, ${firstName}.` : 'Welcome to T-Quote.'}
                </h1>
                <p className="text-lg text-gray-300 max-w-md mx-auto md:mx-0 font-medium">
                    {currentDate}
                </p>
                {!user && <p className="text-sm text-gray-400 mt-2">Sign in to access your dashboard.</p>}
            </div>

            {/* Smart Voice Action */}
            <div className="relative group z-10">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button 
                    onClick={() => setIsLiveAssistantOpen(true)}
                    className="relative w-full md:w-auto bg-black text-white px-8 py-4 rounded-full flex items-center gap-4 transition-all transform group-hover:scale-[1.02] border border-white/10 shadow-2xl"
                >
                    <div className="relative flex h-12 w-12 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20 delay-100"></span>
                        <span className="animate-ping absolute inline-flex h-[80%] w-[80%] rounded-full bg-primary opacity-40"></span>
                        <div className="relative inline-flex rounded-full h-10 w-10 bg-gradient-to-br from-primary to-pink-600 items-center justify-center text-white shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-left pr-4">
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Gemini Live</span>
                        <span className="block text-lg font-bold">Talk to T-Quote AI</span>
                    </div>
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 space-y-8">
        
        {/* Stats Row */}
        {user && <QuickStats leads={myLeads} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
                {/* Quick Actions Grid */}
                <HomeActions />

                {/* Agenda */}
                {user && todaysFollowUps.length > 0 ? (
                    <TodaysFollowUps 
                        leads={todaysFollowUps} 
                        onLoadLead={handleLoadLead}
                        onComplete={handleCompleteFollowUp}
                        onReschedule={handleRescheduleFollowUp}
                    />
                ) : user ? (
                    <Card className="border-dashed bg-muted/20">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <span className="text-4xl mb-3 block opacity-50">📅</span>
                            <p className="font-medium">No follow-ups scheduled.</p>
                            <p className="text-xs mt-1">Check your Leads Portal to find opportunities.</p>
                        </CardContent>
                    </Card>
                ) : null}
            </div>

            {/* Side Column */}
            <div className="space-y-8">
                {/* Promo Carousel */}
                <PromotionsSpotlight promotions={spotlightPromotions} />

                {/* AI Coach Teaser */}
                {user && (
                    <div 
                        onClick={() => setIsCoachModalOpen(true)}
                        className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden cursor-pointer group hover:border-primary/50 transition-all"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center text-xl mb-3">
                                    💡
                                </div>
                                <h3 className="text-lg font-bold mb-1">Sales Coach</h3>
                                <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                                    Analyze your recent wins and get tips to close open leads.
                                </p>
                            </div>
                            <div className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <AISalesCoachModal isOpen={isCoachModalOpen} onClose={() => setIsCoachModalOpen(false)} />
      <LiveAssistant isOpen={isLiveAssistantOpen} onClose={() => setIsLiveAssistantOpen(false)} />
    </div>
  );
};
