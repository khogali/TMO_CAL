import React from 'react';
import { SavedLead, LeadStatus } from '../../types';

interface DashboardStatsProps {
  leads: SavedLead[];
}

const StatCard: React.FC<{ 
    icon: React.ReactNode; 
    trend: string; 
    trendUp: boolean; 
    label: string; 
    value: string | number 
}> = ({ icon, trend, trendUp, label, value }) => {
    return (
        <div className="flex flex-col gap-1 rounded-xl p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 font-display">
            <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {icon}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trendUp ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'}`}>
                    {trend}
                </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold">{value}</p>
        </div>
    );
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ leads }) => {
    const activeLeads = leads.filter(lead => lead.status !== LeadStatus.CLOSED_WON && lead.status !== LeadStatus.CLOSED_LOST);
    const closedLeads = leads.filter(lead => lead.status === LeadStatus.CLOSED_WON || lead.status === LeadStatus.CLOSED_LOST);
    const wonLeads = closedLeads.filter(lead => lead.status === LeadStatus.CLOSED_WON).length;
    const closingRatio = closedLeads.length > 0 ? Math.round((wonLeads / closedLeads.length) * 100) : 0;

    return (
        <div className="grid grid-cols-2 gap-4 mb-8 font-display">
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
                trend="+12%"
                trendUp={true}
                label="Quotes"
                value={leads.length} 
            />
            <StatCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
                trend="+5%"
                trendUp={true}
                label="Conversion"
                value={`${closingRatio}%`}
            />
        </div>
    );
};

export default DashboardStats;
