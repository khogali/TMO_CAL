
import React, { useState, useRef, useEffect } from 'react';
import { SavedLead, LeadStatus } from '../../types';

interface TodaysFollowUpsProps {
  leads: SavedLead[];
  onLoadLead: (lead: SavedLead) => void;
  onComplete: (leadId: string, status: LeadStatus.CLOSED_WON | LeadStatus.CLOSED_LOST) => void;
  onReschedule: (leadId: string) => void;
}

const FollowUpItem: React.FC<{ 
    lead: SavedLead; 
    onLoadLead: (lead: SavedLead) => void;
    onComplete: (leadId: string, status: LeadStatus.CLOSED_WON | LeadStatus.CLOSED_LOST) => void;
    onReschedule: (leadId: string) => void;
}> = ({ lead, onLoadLead, onComplete, onReschedule }) => {
    const timeString = lead.followUpAt ? new Date(lead.followUpAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'All Day';
    const [showCompleteMenu, setShowCompleteMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowCompleteMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleComplete = (status: LeadStatus.CLOSED_WON | LeadStatus.CLOSED_LOST) => {
        onComplete(lead.id, status);
        setShowCompleteMenu(false);
    }
    
    return (
        <div className="group flex items-center justify-between p-3.5 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 min-w-0" onClick={() => onLoadLead(lead)}>
                <div className="flex-shrink-0 w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{timeString.split(' ')[1]}</span>
                    <span className="text-base font-black leading-none">{timeString.split(' ')[0]}</span>
                </div>
                <div className="min-w-0 cursor-pointer">
                    <p className="font-bold text-foreground truncate text-sm">{lead.customerName || 'Unnamed Lead'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${lead.status === 'New' ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                        <p className="text-xs text-muted-foreground truncate">{lead.status}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-1">
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowCompleteMenu(!showCompleteMenu)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-green-600 hover:bg-green-500/10 rounded-full transition-colors" title="Complete">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </button>
                    {showCompleteMenu && (
                        <div className="absolute top-full right-0 mt-2 w-36 bg-card border border-border rounded-xl shadow-xl z-30 overflow-hidden animate-fade-in-down p-1">
                            <button onClick={() => handleComplete(LeadStatus.CLOSED_WON)} className="w-full text-left px-3 py-2 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg flex items-center gap-2 mb-1">
                                <span className="text-lg">🎉</span> Won
                            </button>
                            <button onClick={() => handleComplete(LeadStatus.CLOSED_LOST)} className="w-full text-left px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2">
                                <span className="text-lg">❌</span> Lost
                            </button>
                        </div>
                    )}
                </div>

                <button onClick={() => onReschedule(lead.id)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 rounded-full transition-colors" title="Reschedule">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
            </div>
        </div>
    );
}

const TodaysFollowUps: React.FC<TodaysFollowUpsProps> = ({ leads, onLoadLead, onComplete, onReschedule }) => {
  return (
    <div className="space-y-3">
        {leads.map(lead => (
            <FollowUpItem 
                key={lead.id} 
                lead={lead} 
                onLoadLead={onLoadLead}
                onComplete={onComplete}
                onReschedule={onReschedule}
            />
        ))}
    </div>
  );
};

export default TodaysFollowUps;
