
import React, { useState, useMemo, useEffect } from 'react';
import { SavedLead, LeadStatus, UserProfile } from './types';
import { useAuth, useData, useUI } from './context/AppContext';
import ListView from './components/leads/ListView';
import BoardView from './components/leads/BoardView';
import CalendarView from './components/leads/CalendarView';
import Input from './components/ui/Input';
import Select from './components/ui/Select';
import Button from './components/ui/Button';

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

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    
    const headers = ['ID', 'Name', 'Phone', 'Status', 'Assigned To', 'Updated At', 'Notes', 'Tags'];
    const rows = filteredLeads.map(l => {
        const assignee = allUsers.find(u => u.uid === l.assignedToUid)?.displayName || 'Unknown';
        return [
            l.id, 
            `"${(l.customerName || '').replace(/"/g, '""')}"`, 
            l.customerPhone, 
            l.status, 
            assignee,
            new Date(l.updatedAt).toISOString(), 
            `"${(l.notes || '').replace(/"/g, '""')}"`,
            `"${(l.tags || []).join(', ')}"`
        ];
    });
    
    const csvContent = [
        headers.join(','), 
        ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="flex flex-col h-full bg-muted/5 sm:bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Title & Stats */}
                  <div>
                      <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                          Leads
                          <span className="text-sm font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              {filteredLeads.length}
                          </span>
                      </h1>
                      <p className="text-sm text-muted-foreground">Manage your pipeline.</p>
                  </div>

                  {/* Actions & View Switcher */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="flex items-center p-1 bg-muted rounded-xl">
                          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="List View">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                          </button>
                          <button onClick={() => setViewMode('board')} className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Board View">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          </button>
                          <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} title="Calendar View">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </button>
                      </div>
                      <Button onClick={handleExportCSV} variant="secondary" size="sm" className="hidden sm:flex shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Export
                      </Button>
                      <Button onClick={() => setView('new-quote')} size="sm" className="hidden sm:flex shadow-md">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          Add Lead
                      </Button>
                  </div>
              </div>

              {/* Filters Bar */}
              <div className="mt-4 flex flex-col md:flex-row gap-3">
                  <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <input 
                          type="text" 
                          placeholder="Search leads..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-transparent focus:bg-background focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                      />
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      <button 
                          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${isFiltersOpen ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                          Filters
                      </button>
                      <div className="h-8 w-px bg-border my-auto mx-1"></div>
                      <div className="flex items-center bg-background border border-border rounded-xl px-1">
                          <button onClick={() => setSortBy('updatedAt')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${sortBy === 'updatedAt' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Recent</button>
                          <button onClick={() => setSortBy('followUpAt')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${sortBy === 'followUpAt' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Follow-up</button>
                      </div>
                      <button onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground">
                          {sortDirection === 'desc' 
                              ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" /></svg>
                              : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 000 2h5a1 1 0 100-2H3zM3 7a1 1 0 000 2h11a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 8a1 1 0 102 0V2.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 2.414V8z" /></svg>
                          }
                      </button>
                  </div>
              </div>

              {/* Collapsible Filter Panel */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden transition-all duration-300 ease-in-out ${isFiltersOpen ? 'max-h-40 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <Select name="statusFilter" label="Status" options={statusOptions} value={statusFilter} onChange={(_, val) => setStatusFilter(val as LeadStatus | 'all')} className="w-full" />
                  <Select name="assigneeFilter" label="Assignee" options={assigneeOptions} value={assigneeFilter} onChange={(_, val) => setAssigneeFilter(val)} className="w-full" />
                  <Input label="Tags" name="tagFilter" placeholder="Filter by tag..." value={tagFilter} onChange={e => setTagFilter(e.target.value)} />
              </div>

              {/* Bulk Actions Banner */}
              {selectedLeads.length > 0 && viewMode === 'list' && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between animate-fade-in-down shadow-sm">
                      <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                          <p className="text-sm font-bold text-primary">{selectedLeads.length} Selected</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <Select name="bulkStatus" value="" onChange={(_, val) => handleBulkStatusChange(val as LeadStatus)} options={[{ value: "", label: "Set Status..." }, ...Object.values(LeadStatus).map(s => ({ value: s, label: s }))]} className="w-40" />
                          <button onClick={handleBulkDelete} className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Selected">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full flex-grow">
          {renderView()}
      </main>
    </div>
  );
};

export default LeadsPortal;
