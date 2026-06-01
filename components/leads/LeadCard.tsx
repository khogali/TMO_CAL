
import React, { useState, useMemo, useEffect } from 'react';
import { SavedLead, LeadStatus, UserProfile, ActivityLogEntry, ActivityLogType, QuoteVersion, UserRole, Store } from '../../types';
import Select from '../ui/Select';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface LeadCardProps {
  lead: SavedLead;
  assignedUser?: UserProfile;
  isSelected: boolean;
  onSelect: (leadId: string) => void;
  onLoadLead: (lead: SavedLead) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isDraggable?: boolean;
  onUpdate: (leadId: string, updates: Partial<Pick<SavedLead, 'status' | 'notes' | 'followUpAt' | 'tags' | 'assignedToUid'>>) => void;
  onDelete: (leadId: string) => void;
  userProfile: UserProfile | null;
  allUsers: UserProfile[];
  allStores: Store[];
  // New props for drag-and-drop
  onDragStart?: (e: React.DragEvent, leadId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

const formatCurrency = (amountInCents: number) => {
    return (amountInCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
        case LeadStatus.NEW: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        case LeadStatus.CONTACTED: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
        case LeadStatus.FOLLOW_UP: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
        case LeadStatus.CLOSED_WON: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        case LeadStatus.CLOSED_LOST: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
};

// --- SCORING LOGIC ---
const calculateLeadScore = (lead: SavedLead, monthlyValue: number) => {
    let score = 0;
    
    // 1. Status Progression
    if (lead.status === LeadStatus.CLOSED_WON) return 100;
    if (lead.status === LeadStatus.CLOSED_LOST) return 0;
    if (lead.status === LeadStatus.FOLLOW_UP) score += 40;
    if (lead.status === LeadStatus.CONTACTED) score += 20;
    if (lead.status === LeadStatus.NEW) score += 10;

    // 2. Data Quality
    if (lead.customerPhone) score += 15;
    if (lead.notes && lead.notes.length > 20) score += 10;
    if (lead.tags && lead.tags.length > 0) score += 5;

    // 3. Deal Value
    if (monthlyValue > 15000) score += 20; // > $150/mo
    else if (monthlyValue > 8000) score += 10; // > $80/mo

    // 4. Recency (Decay)
    const daysSinceUpdate = (Date.now() - lead.updatedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 2) score += 10;
    else if (daysSinceUpdate > 7) score -= 10;
    else if (daysSinceUpdate > 30) score -= 30;

    return Math.max(0, Math.min(100, score));
};

const getTemperature = (score: number) => {
    if (score >= 75) return { icon: '🔥', label: 'Hot', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' };
    if (score >= 40) return { icon: '🌤️', label: 'Warm', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' };
    return { icon: '❄️', label: 'Cold', bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-500', border: 'border-slate-200 dark:border-slate-700' };
};

const UserAvatar: React.FC<{ name?: string }> = ({ name }) => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return (
        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-[10px] font-bold ring-1 ring-primary/20">
            {initial}
        </div>
    );
};

const LeadCard: React.FC<LeadCardProps> = ({ 
    lead, assignedUser, isSelected, onSelect, onLoadLead, isExpanded, onToggleExpand, isDraggable = false,
    onUpdate, onDelete, userProfile, allUsers, allStores,
    // Drag-and-drop props
    onDragStart, onDragEnd, isDragging
}) => {
  const latestVersion = lead.versions?.[lead.versions.length - 1];
  const totals = latestVersion?.calculatedTotals;
  const statusBadgeClass = getStatusBadge(lead.status);

  // State for editing, synced when expanded
  const [notes, setNotes] = useState(lead.notes);
  const [status, setStatus] = useState(lead.status);
  const [followUpAt, setFollowUpAt] = useState(lead.followUpAt ? new Date(lead.followUpAt).toISOString().substring(0, 16) : '');
  const [assignedToUid, setAssignedToUid] = useState(lead.assignedToUid);
  const [tags, setTags] = useState(lead.tags || []);
  const [newTag, setNewTag] = useState('');

  // Calculations
  const daysInactive = Math.floor((Date.now() - lead.updatedAt) / (1000 * 60 * 60 * 24));
  const isStale = daysInactive > 5 && lead.status !== LeadStatus.CLOSED_WON && lead.status !== LeadStatus.CLOSED_LOST;
  const monthlyValue = totals?.totalMonthlyInCents || 0;
  const score = calculateLeadScore(lead, monthlyValue);
  const temp = getTemperature(score);
  const interactionCount = lead.activityLog?.length || 0;

  // Contact Actions
  const handleCall = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (lead.customerPhone) window.open(`tel:${lead.customerPhone}`);
  };

  const handleSms = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (lead.customerPhone) window.open(`sms:${lead.customerPhone}`);
  };

  useEffect(() => {
    if (isExpanded) {
        setNotes(lead.notes);
        setStatus(lead.status);
        setFollowUpAt(lead.followUpAt ? new Date(lead.followUpAt).toISOString().substring(0, 16) : '');
        setAssignedToUid(lead.assignedToUid);
        setTags(lead.tags || []);
    }
  }, [isExpanded, lead]);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag]);
        setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
    }
  };

  const handleSave = () => {
      onUpdate(lead.id, {
          notes,
          status,
          followUpAt: followUpAt ? new Date(followUpAt).getTime() : undefined,
          assignedToUid,
          tags,
      });
      onToggleExpand();
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm('Are you sure you want to delete this lead?')) {
          onDelete(lead.id);
          onToggleExpand(); // Close the expanded view if it was open (though component unmounts usually)
      }
  };
  
  const renderActivityLog = (entry: ActivityLogEntry) => {
      let content = '';
      const author = allUsers.find(u => u.uid === entry.by)?.displayName || entry.by || 'System';
      switch(entry.type) {
          case ActivityLogType.CREATED: content = `Lead created by ${author}.`; break;
          case ActivityLogType.STATUS_CHANGE: content = `Status changed from ${entry.from} to ${entry.to} by ${author}.`; break;
          case ActivityLogType.NOTES_UPDATED: content = `Notes were updated by ${author}.`; break;
          case ActivityLogType.FOLLOW_UP_SET: content = `Follow-up set for ${entry.to} by ${author}.`; break;
          case ActivityLogType.QUOTE_VERSIONED: content = `New quote version created by ${author}.`; break;
          case ActivityLogType.TAGS_UPDATED: content = `Tags updated by ${author}.`; break;
          case ActivityLogType.REASSIGNED: content = `Reassigned to ${entry.to} by ${author}.`; break;
          default: content = 'An update occurred.';
      }
      return (
           <div key={entry.id} className="flex gap-3 items-start text-xs">
              <span className="text-muted-foreground whitespace-nowrap w-20">{new Date(entry.timestamp).toLocaleDateString()}</span>
              <span className="text-foreground/80">{content}</span>
           </div>
      )
  }

  const canReassign = userProfile && [UserRole.ADMIN, UserRole.DISTRICT_MANAGER, UserRole.STORE_MANAGER].includes(userProfile.role);
  
  const reassignableUsers = useMemo(() => {
      if (!canReassign || !userProfile) return [];
      switch (userProfile.role) {
          case UserRole.ADMIN: return allUsers;
          case UserRole.DISTRICT_MANAGER: return allUsers.filter(u => userProfile.managedStoreIds?.includes(u.storeId || ''));
          case UserRole.STORE_MANAGER: return allUsers.filter(u => u.storeId === userProfile.storeId);
          default: return [];
      }
  }, [canReassign, userProfile, allUsers]);

  const reassignOptions = reassignableUsers.map(u => ({ value: u.uid, label: u.displayName }));
  const statusOptions = Object.values(LeadStatus).map(s => ({ value: s, label: s }));

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart ? (e) => onDragStart(e, lead.id) : undefined}
      onDragEnd={onDragEnd}
      className={`group relative bg-card rounded-2xl border transition-all duration-200 
        ${isSelected ? 'border-primary shadow-[0_0_0_2px_rgba(226,0,116,0.2)]' : 'border-border'} 
        ${isExpanded ? 'shadow-lg ring-1 ring-black/5' : 'hover:border-primary/30 hover:shadow-md'} 
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} 
        ${isDragging ? 'opacity-50' : ''}
        ${isStale ? 'border-l-[6px] border-l-amber-400' : ''}
      `}
    >
      <div 
        className={`p-4 sm:p-5 ${!isDraggable ? 'cursor-pointer' : ''}`} 
        onClick={!isDraggable ? onToggleExpand : undefined}
      >
        <div className="flex justify-between items-start gap-3">
          {/* Checkbox & Avatar */}
          <div className="flex items-center gap-3 shrink-0">
            {!isDraggable && (
              <div 
                className="relative flex items-center justify-center w-5 h-5"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(lead.id)}
                    className="peer appearance-none w-5 h-5 border-2 border-muted-foreground/30 rounded-md checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                />
                <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="hidden sm:block">
                <UserAvatar name={assignedUser?.displayName} />
            </div>
          </div>

          {/* Main Info */}
          <div className="flex-grow min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <h3 className="font-bold text-foreground text-base truncate leading-tight">
                    {lead.customerName || 'Unnamed Lead'}
                </h3>
                
                {/* Temperature Badge */}
                <div className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${temp.bg} ${temp.text} ${temp.border}`}>
                    <span>{temp.icon}</span>
                    <span>{temp.label}</span>
                </div>

                {lead.salesforceId && (
                    <span className="inline-flex" title="Synced with Salesforce">
                        <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <span>{lead.customerPhone}</span>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
                {interactionCount > 0 && (
                    <>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className="text-xs text-muted-foreground/80">{interactionCount} Interactions</span>
                    </>
                )}
            </div>

            {/* Quick Actions Row */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
                {lead.customerPhone && (
                    <>
                        <button 
                            onClick={handleCall}
                            className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 rounded-md text-xs font-semibold transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            Call
                        </button>
                        <button 
                            onClick={handleSms}
                            className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-md text-xs font-semibold transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            Text
                        </button>
                    </>
                )}
                {totals && totals.totalMonthlyInCents > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs font-bold text-foreground">
                        <span className="text-muted-foreground font-normal">Est.</span>
                        {formatCurrency(totals.totalMonthlyInCents)}
                    </div>
                )}
            </div>

            {lead.tags && lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {lead.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-medium bg-muted/70 text-foreground/70 px-2 py-0.5 rounded-md border border-border/50">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
          </div>

          {/* Status & Action */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isStale && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 animate-pulse">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Stale
                </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${statusBadgeClass}`}>
                {lead.status}
            </span>
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 mt-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out bg-muted/20 border-t border-border/50 ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Quick Actions & Status */}
                <div className="space-y-4">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lead Status</label>
                        <Select name="status" value={status} onChange={(_, val) => setStatus(val as LeadStatus)} options={statusOptions} className="w-full" />
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Follow Up</label>
                        <Input name="followUpAt" type="datetime-local" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)} label="" />
                    </div>

                    {canReassign && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned To</label>
                            <Select name="assignedTo" value={assignedToUid} onChange={(_, val) => setAssignedToUid(val)} options={reassignOptions} className="w-full" />
                        </div>
                    )}
                </div>

                {/* Middle: Notes & Tags */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</label>
                        <textarea 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            placeholder="Add notes..."
                            className="w-full h-32 rounded-xl bg-background border border-border p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</label>
                        <div className="flex gap-2">
                            <Input 
                                name="newTag" 
                                value={newTag} 
                                onChange={e => setNewTag(e.target.value)} 
                                onKeyDown={handleTagInputKeyDown} 
                                placeholder="Add tag..." 
                                label=""
                                className="flex-grow"
                            />
                            <Button size="sm" variant="secondary" onClick={handleAddTag} type="button">Add</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: History & Actions */}
            <div className="pt-4 border-t border-border flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Recent Activity</h4>
                    <div className="space-y-1.5">
                        {[...(lead.activityLog || [])].reverse().slice(0, 3).map(renderActivityLog)}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                    {/* Versions */}
                    {lead.versions && lead.versions.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-2 mb-2">
                            {lead.versions.slice(-3).reverse().map((v, i) => (
                                <button 
                                    key={v.versionCreatedAt}
                                    onClick={() => { onLoadLead({ ...lead, versions: [v] }); onToggleExpand(); }}
                                    className="px-3 py-1.5 text-xs font-medium bg-background border border-border rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-2"
                                >
                                    <span>Version {lead.versions.length - i}</span>
                                    <span className="font-bold">{formatCurrency(v.calculatedTotals?.totalMonthlyInCents || 0)}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                            Delete
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onToggleExpand}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
