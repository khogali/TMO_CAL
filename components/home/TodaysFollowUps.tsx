import React, { useState, useRef, useEffect } from 'react';
import { SavedLead, LeadStatus } from '../../types';
import Button from '../ui/Button';

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
        <div className="group flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-xs font-bold uppercase">{timeString.split(' ')[1]}</span>
                    <span className="text-sm font-bold">{timeString.split(' ')[0]}</span>
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{lead.customerName || 'Unnamed Lead'}</p>
                    <p className="text-sm text-muted-foreground truncate">{lead.customerPhone || 'No phone'} • {lead.status}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button onClick={() => onLoadLead(lead)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Quote">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
                
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowCompleteMenu(!showCompleteMenu)} className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-500/10 rounded-lg transition-colors" title="Complete">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    {showCompleteMenu && (
                        <div className="absolute top-full right-0 mt-2 w-32 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden animate-fade-in-down">
                            <button onClick={() => handleComplete(LeadStatus.CLOSED_WON)} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-500/10 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div>Won</button>
                            <button onClick={() => handleComplete(LeadStatus.CLOSED_LOST)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div>Lost</button>
                        </div>
                    )}
                </div>

                <button onClick={() => onReschedule(lead.id)} className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-colors" title="Reschedule">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
            </div>
        </div>
    );
}

const TodaysFollowUps: React.FC<TodaysFollowUpsProps> = ({ leads, onLoadLead, onComplete, onReschedule }) => {
  return (
    <div>
        <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold text-foreground">Today's Agenda</h2>
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{leads.length} Pending</span>
        </div>
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
    </div>
  );
};

export default TodaysFollowUps;