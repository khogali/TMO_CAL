import React from 'react';
import { SavedLead, LeadStatus } from '../../types';

interface RecentQuotesProps {
    leads: SavedLead[];
    onViewAll: () => void;
    onSelectLead: (lead: SavedLead) => void;
}

const QuoteItem: React.FC<{ lead: SavedLead; onClick: () => void }> = ({ lead, onClick }) => {
    const getStatusColor = (status: LeadStatus) => {
        switch (status) {
            case LeadStatus.CLOSED_WON: return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300';
            case LeadStatus.CLOSED_LOST: return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
            case LeadStatus.DRAFT: return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300';
            default: return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300';
        }
    };

    const getStatusLabel = (status: LeadStatus) => {
        switch (status) {
            case LeadStatus.CLOSED_WON: return 'Accepted';
            case LeadStatus.CLOSED_LOST: return 'Lost';
            case LeadStatus.DRAFT: return 'Draft';
            default: return 'Pending';
        }
    };

    const latestVersion = lead.versions && lead.versions.length > 0 ? lead.versions[lead.versions.length - 1] : null;
    const quoteConfig = latestVersion?.quoteConfig;

    const planName = quoteConfig?.plan ? 
        (quoteConfig.plan.includes('go5g-plus') ? 'Go5G Plus' : 
         quoteConfig.plan.includes('go5g-next') ? 'Go5G Next' : 
         quoteConfig.plan.includes('essentials') ? 'Essentials' : 'T-Mobile Plan') 
        : 'New Quote';

    const lineCount = quoteConfig?.lines || 0;
    const monthlyTotal = latestVersion?.calculatedTotals?.totalMonthlyInCents ? latestVersion.calculatedTotals.totalMonthlyInCents / 100 : 0;

    return (
        <div 
            onClick={onClick}
            className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-all shadow-sm cursor-pointer font-display"
        >
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 group-hover:bg-primary group-hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <p className="text-slate-900 dark:text-slate-100 font-bold text-base">{lead.customerName || 'Unknown Customer'}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                        {lineCount} {lineCount === 1 ? 'Line' : 'Lines'} • {planName}
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <p className="text-slate-900 dark:text-slate-100 font-bold text-base">
                    ${monthlyTotal.toFixed(0)}<span className="text-xs font-normal text-slate-500 dark:text-slate-400">/mo</span>
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 ${getStatusColor(lead.status)}`}>
                    {getStatusLabel(lead.status)}
                </span>
            </div>
        </div>
    );
};

const RecentQuotes: React.FC<RecentQuotesProps> = ({ leads, onViewAll, onSelectLead }) => {
    // Sort by last updated or created
    const sortedLeads = [...leads].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)).slice(0, 5);

    return (
        <div className="font-display">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Recent Quotes</h3>
                <button onClick={onViewAll} className="text-primary text-sm font-semibold hover:underline">View All</button>
            </div>
            <div className="flex flex-col gap-3">
                {sortedLeads.length > 0 ? (
                    sortedLeads.map(lead => (
                        <QuoteItem key={lead.id} lead={lead} onClick={() => onSelectLead(lead)} />
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">No recent quotes found.</div>
                )}
            </div>
        </div>
    );
};

export default RecentQuotes;
