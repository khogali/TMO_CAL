
import React from 'react';
import { SavedLead, LeadStatus } from '../../types';

interface QuickStatsProps {
  leads: SavedLead[];
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; theme: string }> = ({ icon, title, value, theme }) => (
    <div className={`relative overflow-hidden rounded-[2.5rem] border border-white/10 p-7 shadow-glass group transition-all duration-500 hover:scale-[1.02] ${theme} backdrop-blur-xl`}>
        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex justify-between items-start">
                <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl text-white shadow-sm ring-1 ring-white/20">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none mb-2 drop-shadow-md">{value}</p>
                <p className="text-xs font-bold text-white/80 uppercase tracking-widest">{title}</p>
            </div>
        </div>
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-white/20 transition-colors duration-700"></div>
    </div>
);

const QuickStats: React.FC<QuickStatsProps> = ({ leads }) => {
    const activeLeads = leads.filter(lead => lead.status !== LeadStatus.CLOSED_WON && lead.status !== LeadStatus.CLOSED_LOST);
    
    const followUpsToday = leads.filter(lead => {
        if (!lead.followUpAt) return false;
        const now = new Date();
        const followUpDate = new Date(lead.followUpAt);
        return now.getFullYear() === followUpDate.getFullYear() &&
               now.getMonth() === followUpDate.getMonth() &&
               now.getDate() === followUpDate.getDate();
    }).length;
    
    const closedLeads = leads.filter(lead => lead.status === LeadStatus.CLOSED_WON || lead.status === LeadStatus.CLOSED_LOST);
    const wonLeads = closedLeads.filter(lead => lead.status === LeadStatus.CLOSED_WON).length;
    const closingRatio = closedLeads.length > 0 ? Math.round((wonLeads / closedLeads.length) * 100) : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                title="Active Pipeline"
                value={activeLeads.length}
                theme="bg-gradient-to-br from-blue-600/90 to-indigo-700/90"
            />
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Due Today"
                value={followUpsToday}
                theme="bg-gradient-to-br from-amber-500/90 to-orange-600/90"
            />
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Win Rate"
                value={`${closingRatio}%`}
                theme="bg-gradient-to-br from-emerald-500/90 to-teal-600/90"
            />
        </div>
    );
};

export default QuickStats;
