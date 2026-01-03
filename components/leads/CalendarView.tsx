
import React, { useState, useMemo } from 'react';
import { SavedLead, LeadStatus } from '../../types';

interface CalendarViewProps {
  leads: SavedLead[];
  onViewDetails: (lead: SavedLead) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ leads, onViewDetails }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay(); 
  const daysInMonth = endOfMonth.getDate();

  // Filter leads with follow-up dates
  const leadsWithFollowUp = useMemo(() => leads.filter(l => l.followUpAt), [leads]);

  // Helper to check if a day has events
  const hasEvents = (day: number) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return leadsWithFollowUp.some(lead => {
          const d = new Date(lead.followUpAt!);
          return d.getDate() === day && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      });
  };

  // Helper to get leads for the selected date
  const selectedLeads = useMemo(() => {
      return leadsWithFollowUp.filter(lead => {
          const d = new Date(lead.followUpAt!);
          return d.getDate() === selectedDate.getDate() && 
                 d.getMonth() === selectedDate.getMonth() && 
                 d.getFullYear() === selectedDate.getFullYear();
      }).sort((a, b) => (a.followUpAt || 0) - (b.followUpAt || 0));
  }, [selectedDate, leadsWithFollowUp]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  
  const handleDateClick = (day: number) => {
      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  const isSelected = (day: number) => {
      return selectedDate.getDate() === day && 
             selectedDate.getMonth() === currentMonth.getMonth() &&
             selectedDate.getFullYear() === currentMonth.getFullYear();
  };

  const isToday = (day: number) => {
      const today = new Date();
      return today.getDate() === day && 
             today.getMonth() === currentMonth.getMonth() && 
             today.getFullYear() === currentMonth.getFullYear();
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
        {/* Calendar Widget */}
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-border/50">
                <h2 className="font-bold text-lg ml-2 text-foreground">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
            
            {/* Days Header */}
            <div className="grid grid-cols-7 text-center py-2 border-b border-border/50 bg-muted/20">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <span key={d} className="text-xs font-bold text-muted-foreground">{d}</span>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 p-2 gap-y-2">
                {blanks.map((_, i) => <div key={`blank-${i}`} className="h-10" />)}
                
                {days.map(day => {
                    const selected = isSelected(day);
                    const today = isToday(day);
                    const event = hasEvents(day);
                    
                    return (
                        <div key={day} className="flex flex-col items-center justify-center h-12 cursor-pointer" onClick={() => handleDateClick(day)}>
                            <div className={`
                                w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all
                                ${selected ? 'bg-primary text-white shadow-md scale-105' : 
                                  today ? 'bg-primary/10 text-primary font-bold' : 
                                  'hover:bg-muted text-foreground'}
                            `}>
                                {day}
                            </div>
                            {/* Dot Indicator */}
                            <div className="h-1.5 mt-0.5 flex justify-center w-full">
                                {event && <div className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : 'bg-primary'}`} />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Selected Date Header & List */}
        <div>
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-foreground">
                    {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-lg border border-border">
                    {selectedLeads.length} Lead{selectedLeads.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-3">
                {selectedLeads.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
                        <p>No follow-ups scheduled for this day.</p>
                        <button onClick={() => setSelectedDate(new Date())} className="text-sm text-primary font-bold mt-2 hover:underline">
                            Go to Today
                        </button>
                    </div>
                ) : (
                    selectedLeads.map(lead => (
                        <div 
                            key={lead.id} 
                            onClick={() => onViewDetails(lead)}
                            className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <div className="flex flex-col items-center min-w-[3.5rem] px-2 border-r border-border/50 text-center">
                                <span className="text-xs font-bold text-muted-foreground uppercase">
                                    {new Date(lead.followUpAt!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).split(' ')[1]}
                                </span>
                                <span className="text-lg font-black text-foreground leading-none">
                                    {new Date(lead.followUpAt!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).split(' ')[0]}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-foreground truncate">{lead.customerName || 'Unnamed'}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border 
                                        ${lead.status === LeadStatus.NEW ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          lead.status === LeadStatus.CONTACTED ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                          lead.status === LeadStatus.FOLLOW_UP ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                          'bg-gray-50 text-gray-700 border-gray-200'}
                                    `}>
                                        {lead.status}
                                    </span>
                                    {lead.customerPhone && <span className="text-xs text-muted-foreground truncate">• {lead.customerPhone}</span>}
                                </div>
                            </div>
                            <div className="text-muted-foreground/50 group-hover:text-primary transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export default CalendarView;
