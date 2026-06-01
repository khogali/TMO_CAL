
import React, { useState, useMemo, useEffect } from 'react';
import { SavedLead, LeadStatus } from './types';
import { useAuth, useData, useUI } from './context/AppContext';
import ListView from './components/leads/ListView';
import BoardView from './components/leads/BoardView';
import CalendarView from './components/leads/CalendarView';
import Select from './components/ui/Select';
import Button from './components/ui/Button';
import MobileAppShell from './components/ui/MobileAppShell';

type ViewMode = 'list' | 'board' | 'calendar';
type SortBy = 'updatedAt' | 'followUpAt';
type SortDirection = 'asc' | 'desc';

const LeadsPortal: React.FC = () => {
  const { userProfile } = useAuth();
  const {
    allUsers, allStores, visibleLeads, deleteLead,
    handleUpdateLead, setLeadToLoad, handleBulkUpdateLeads, handleBulkDeleteLeads
  } = useData();
  const { setView } = useUI();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | string>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filteredLeads = useMemo(() => {
    return visibleLeads.filter(lead => {
      const searchMatch = (lead.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (lead.customerPhone || '').includes(searchTerm);
      const statusMatch = statusFilter === 'all' || lead.status === statusFilter;
      const assigneeMatch = assigneeFilter === 'all' || lead.assignedToUid === assigneeFilter;
      const tagMatch = !tagFilter.trim() ||
                       (lead.tags && lead.tags.some(tag => tag.toLowerCase().includes(tagFilter.trim().toLowerCase())));
      return searchMatch && statusMatch && assigneeMatch && tagMatch;
    }).sort((a, b) => {
        const valA = a[sortBy] ?? (sortDirection === 'asc' ? Infinity : -Infinity);
        const valB = b[sortBy] ?? (sortDirection === 'asc' ? Infinity : -Infinity);
        if (sortDirection === 'asc') {
            return valA - valB;
        }
        return valB - valA;
    });
  }, [visibleLeads, searchTerm, statusFilter, assigneeFilter, tagFilter, sortBy, sortDirection]);

  const handleSelectLead = (leadId: string) => setSelectedLeads(prev => prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]);
  const handleSelectAll = () => setSelectedLeads(selectedLeads.length === filteredLeads.length ? [] : filteredLeads.map(l => l.id));
  const handleBulkStatusChange = (status: LeadStatus) => {
    if (selectedLeads.length === 0 || !status) return;
    handleBulkUpdateLeads(selectedLeads, { status });
    setSelectedLeads([]);
  };
  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) return;
    if(window.confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) {
        handleBulkDeleteLeads(selectedLeads);
        setSelectedLeads([]);
    }
  };
  const handleToggleExpand = (leadId: string) => setExpandedLeadId(prevId => (prevId === leadId ? null : leadId));
  const handleViewDetailsFromCalendar = (lead: SavedLead) => {
    setViewMode('list');
    setExpandedLeadId(lead.id);
  };
  const onLoadLead = (lead: SavedLead) => {
    setLeadToLoad(lead);
    setView('new-quote');
  };

  useEffect(() => { setSelectedLeads([]); }, [searchTerm, statusFilter, assigneeFilter, tagFilter, sortBy, sortDirection]);

  const renderView = () => {
    const detailProps = { onUpdate: handleUpdateLead, onDelete: deleteLead, onLoadInCalc: onLoadLead, userProfile, allUsers, allStores };
    switch (viewMode) {
      case 'list': return <ListView leads={filteredLeads} selectedLeads={selectedLeads} onSelectLead={handleSelectLead} onSelectAll={handleSelectAll} expandedLeadId={expandedLeadId} onToggleExpand={handleToggleExpand} detailViewProps={detailProps} allUsers={allUsers} />;
      case 'board': return <BoardView leads={filteredLeads} expandedLeadId={expandedLeadId} onToggleExpand={handleToggleExpand} detailViewProps={detailProps} allUsers={allUsers} />;
      case 'calendar': return <CalendarView leads={filteredLeads} onViewDetails={handleViewDetailsFromCalendar} />;
      default: return null;
    }
  };

  const statusOptions = [{ value: 'all', label: 'All Statuses' }, ...Object.values(LeadStatus).map(s => ({ value: s, label: s }))];
  const assigneeOptions = [{ value: 'all', label: 'All Reps' }, ...allUsers.map(u => ({ value: u.uid, label: u.displayName }))];

  return (
    <MobileAppShell>
        {/* Sticky Header & Filters */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-black text-foreground tracking-tight">Leads <span className="text-muted-foreground text-sm font-medium">({filteredLeads.length})</span></h1>
                    <div className="flex items-center gap-2">
                        {/* View Switcher - Compact */}
                        <div className="flex bg-muted rounded-lg p-0.5">
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                            <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-md ${viewMode === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></button>
                            <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md ${viewMode === 'calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                        </div>
                        <Button onClick={() => setView('new-quote')} size="sm" className="h-8 px-3 rounded-lg text-xs font-bold">+ New</Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-muted/50 focus:bg-background border border-transparent focus:border-primary rounded-xl text-sm outline-none transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className={`px-3 rounded-xl border transition-colors ${isFiltersOpen ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    </button>
                </div>

                {/* Expanded Filters */}
                <div className={`grid grid-cols-1 gap-3 overflow-hidden transition-all duration-300 ease-in-out ${isFiltersOpen ? 'max-h-60 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <Select name="statusFilter" label="" options={statusOptions} value={statusFilter} onChange={(_, val) => setStatusFilter(val as LeadStatus | 'all')} className="w-full" />
                    <Select name="assigneeFilter" label="" options={assigneeOptions} value={assigneeFilter} onChange={(_, val) => setAssigneeFilter(val)} className="w-full" />
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-40">
            {selectedLeads.length > 0 && viewMode === 'list' && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between animate-fade-in-down shadow-sm">
                    <p className="text-sm font-bold text-primary ml-2">{selectedLeads.length} Selected</p>
                    <div className="flex items-center gap-2">
                        <Select name="bulkStatus" value="" onChange={(_, val) => handleBulkStatusChange(val as LeadStatus)} options={[{ value: "", label: "Status..." }, ...Object.values(LeadStatus).map(s => ({ value: s, label: s }))]} className="w-32" />
                        <button onClick={handleBulkDelete} className="p-2 text-red-600 bg-red-500/10 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                </div>
            )}
            {renderView()}
        </div>
    </MobileAppShell>
  );
};

export default LeadsPortal;
