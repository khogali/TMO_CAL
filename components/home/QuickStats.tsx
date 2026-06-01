
import React from 'react';
import { SavedLead, LeadStatus } from '../../types';

interface QuickStatsProps {
  leads: SavedLead[];
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; theme: 'blue' | 'amber' | 'green' }> = ({ icon, title, value, theme }) => {
    const themeClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800'
    };

    return (
        <div className={`min-w-[140px] p-4 rounded-2xl border flex flex-col justify-between h-28 ${themeClasses[theme]} snap-start`}>
            <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl bg-white/50 dark:bg-black/20 ${theme === 'blue' ? 'text-blue-600' : theme === 'amber' ? 'text-amber-600' : 'text-green-600'}`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-2xl font-black tracking-tight">{value}</p>
                <p className="text-xs font-bold opacity-70 uppercase tracking-wide">{title}</p>
            </div>
        </div>
    );
};

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
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 snap-x">
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>}
                title="Active"
                value={activeLeads.length}
                theme="blue"
            />
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Due Today"
                value={followUpsToday}
                theme="amber"
            />
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-6.75a1.125 1.125 0 01-1.125-1.125v-9.375m15 13.5v3h-3v-3h3zm-9-13.5V6a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0113.5 6v1.5m-9 0h9" /></svg>}
                title="Win Rate"
                value={`${closingRatio}%`}
                theme="green"
            />
        </div>
    );
};

export default QuickStats;
