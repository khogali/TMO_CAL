import React from 'react';
import { SavedLead, LeadStatus } from '../../types';

interface QuickStatsProps {
  leads: SavedLead[];
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; colorClass: string }> = ({ icon, title, value, colorClass }) => (
    <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                title="Active Leads"
                value={activeLeads.length}
                colorClass="bg-blue-500/10 text-blue-600"
            />
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                title="Due Today"
                value={followUpsToday}
                colorClass="bg-amber-500/10 text-amber-600"
            />
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Win Rate"
                value={`${closingRatio}%`}
                colorClass="bg-green-500/10 text-green-600"
            />
        </div>
    );
};

export default QuickStats;