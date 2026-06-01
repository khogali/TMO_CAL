
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
    handleUpdateLead, setLeadToLoad, handleBulkUpdateLeads, handleBulkDeleteLeads,
    leadToView, setLeadToView
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

  // Handle deep linking to a specific lead
  useEffect(() => {
    if (leadToView) {
        setViewMode('list');
        setExpandedLeadId(leadToView);
        setLeadToView(null); // Clear after handling
    }
  }, [leadToView, setLeadToView]);

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
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg></button>
                            <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-md ${viewMode === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" /></svg></button>
                            <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md ${viewMode === 'calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" /></svg></button>
                        </div>
                        <Button onClick={() => setView('new-quote')} size="sm" className="h-8 px-3 rounded-lg text-xs font-bold">+ New</Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
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
