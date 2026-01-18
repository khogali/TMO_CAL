
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SavedLead, LeadStatus, UserProfile, ActivityLogEntry, ActivityLogType, QuoteVersion, UserRole, Store } from '../../types';
import Select from '../ui/Select';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useHaptics } from '../../hooks/useHaptics';

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
  onDragStart?: (e: React.DragEvent, leadId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

const formatCurrency = (amountInCents: number) => {
    return (amountInCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
        case LeadStatus.NEW: return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
        case LeadStatus.CONTACTED: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300';
        case LeadStatus.FOLLOW_UP: return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
        case LeadStatus.CLOSED_WON: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
        case LeadStatus.CLOSED_LOST: return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
};

const calculateLeadScore = (lead: SavedLead, monthlyValue: number) => {
    let score = 0;
    if (lead.status === LeadStatus.CLOSED_WON) return 100;
    if (lead.status === LeadStatus.CLOSED_LOST) return 0;
    if (lead.status === LeadStatus.FOLLOW_UP) score += 40;
    if (lead.status === LeadStatus.CONTACTED) score += 20;
    if (lead.status === LeadStatus.NEW) score += 10;
    if (lead.customerPhone) score += 15;
    if (lead.notes && lead.notes.length > 20) score += 10;
    if (lead.tags && lead.tags.length > 0) score += 5;
    if (monthlyValue > 15000) score += 20;
    else if (monthlyValue > 8000) score += 10;
    const daysSinceUpdate = (Date.now() - lead.updatedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 2) score += 10;
    else if (daysSinceUpdate > 7) score -= 10;
    else if (daysSinceUpdate > 30) score -= 30;
    return Math.max(0, Math.min(100, score));
};

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
    let color = 'bg-gray-400';
    if (score > 75) color = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
    else if (score > 40) color = 'bg-amber-500';
    else if (score > 20) color = 'bg-blue-500';

    return (
        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }}></div>
        </div>
    );
};

const UserAvatar: React.FC<{ name?: string }> = ({ name }) => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return (
        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-pink-600 text-white text-xs font-bold shadow-sm ring-2 ring-background">
            {initial}
        </div>
    );
};

const LeadCard: React.FC<LeadCardProps> = ({ 
    lead, assignedUser, isSelected, onSelect, onLoadLead, isExpanded, onToggleExpand, isDraggable = false,
    onUpdate, onDelete, userProfile, allUsers,
    onDragStart, onDragEnd, isDragging
}) => {
  const latestVersion = lead.versions?.[lead.versions.length - 1];
  const totals = latestVersion?.calculatedTotals;
  const statusBadgeClass = getStatusBadge(lead.status);
  const { triggerHaptic } = useHaptics();

  const [notes, setNotes] = useState(lead.notes);
  const [status, setStatus] = useState(lead.status);
  const [followUpAt, setFollowUpAt] = useState(lead.followUpAt ? new Date(lead.followUpAt).toISOString().substring(0, 16) : '');
  const [assignedToUid, setAssignedToUid] = useState(lead.assignedToUid);
  const [tags, setTags] = useState(lead.tags || []);
  const [newTag, setNewTag] = useState('');

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const swipeThreshold = 120;
  const hasVibrated = useRef(false);

  const daysInactive = Math.floor((Date.now() - lead.updatedAt) / (1000 * 60 * 60 * 24));
  const isStale = daysInactive > 5 && lead.status !== LeadStatus.CLOSED_WON && lead.status !== LeadStatus.CLOSED_LOST;
  const monthlyValue = totals?.totalMonthlyInCents || 0;
  const score = calculateLeadScore(lead, monthlyValue);

  const handleCall = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (lead.customerPhone) {
          window.open(`tel:${lead.customerPhone}`);
          onUpdate(lead.id, { status: LeadStatus.CONTACTED });
      }
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

  const handleDelete = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if(window.confirm('Are you sure you want to delete this lead?')) {
          onDelete(lead.id);
          if (isExpanded) onToggleExpand(); 
      }
  };

  const onTouchStart = (e: React.TouchEvent) => {
      if (isDraggable || isExpanded) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      setIsSwiping(true);
      hasVibrated.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
      if (!isSwiping || isDraggable || isExpanded) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - startX.current;
      const diffY = currentY - startY.current;

      if (Math.abs(diffX) > Math.abs(diffY)) {
          if (Math.abs(diffX) > 10 && e.cancelable) e.preventDefault(); 
          setSwipeOffset(diffX);

          if (Math.abs(diffX) > swipeThreshold && !hasVibrated.current) {
              triggerHaptic('medium');
              hasVibrated.current = true;
          } else if (Math.abs(diffX) < swipeThreshold && hasVibrated.current) {
              hasVibrated.current = false;
          }
      }
  };

  const onTouchEnd = () => {
      if (!isSwiping) return;
      setIsSwiping(false);

      if (swipeOffset > swipeThreshold) {
          if (lead.customerPhone) handleCall();
          else onUpdate(lead.id, { status: LeadStatus.CONTACTED });
          setTimeout(() => setSwipeOffset(0), 300);
      } else if (swipeOffset < -swipeThreshold) {
          handleDelete();
          setSwipeOffset(0);
      } else {
          setSwipeOffset(0);
      }
  };
  
  const renderActivityLog = (entry: ActivityLogEntry) => {
      let content = '';
      const author = allUsers.find(u => u.uid === entry.by)?.displayName || entry.by || 'System';
      switch(entry.type) {
          case ActivityLogType.CREATED: content = `Created by ${author}`; break;
          case ActivityLogType.STATUS_CHANGE: content = `Status: ${entry.from} → ${entry.to}`; break;
          case ActivityLogType.NOTES_UPDATED: content = `Notes updated by ${author}`; break;
          default: content = 'Update occurred';
      }
      return (
           <div key={entry.id} className="flex gap-3 items-center text-xs py-1.5">
              <span className="text-muted-foreground w-16 whitespace-nowrap tabular-nums">{new Date(entry.timestamp).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
              <span className="text-foreground/80 font-medium truncate">{content}</span>
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
    <div className="relative group select-none touch-pan-y">
      {/* Background Actions */}
      {!isDraggable && !isExpanded && (
          <div className="absolute inset-0 rounded-[1.75rem] flex overflow-hidden">
              <div 
                className={`flex-1 bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-start pl-8 transition-opacity duration-300 ${swipeOffset > 0 ? 'opacity-100' : 'opacity-0'}`}
              >
                  <div className={`flex items-center gap-2 text-white font-bold transform transition-transform duration-200 ${swipeOffset > swipeThreshold ? 'scale-110' : 'scale-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span>{lead.customerPhone ? 'Quick Call' : 'Mark Contacted'}</span>
                  </div>
              </div>
              <div 
                className={`flex-1 bg-gradient-to-l from-red-500 to-rose-600 flex items-center justify-end pr-8 transition-opacity duration-300 ${swipeOffset < 0 ? 'opacity-100' : 'opacity-0'}`}
              >
                  <div className={`flex items-center gap-2 text-white font-bold transform transition-transform duration-200 ${swipeOffset < -swipeThreshold ? 'scale-110' : 'scale-100'}`}>
                      <span>Delete</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                  </div>
              </div>
          </div>
      )}

      {/* Main Card */}
      <div
        draggable={isDraggable}
        onDragStart={onDragStart ? (e) => onDragStart(e, lead.id) : undefined}
        onDragEnd={onDragEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className={`relative bg-card rounded-[1.75rem] border transition-all duration-300 ease-out overflow-hidden
            ${isSelected ? 'border-primary shadow-[0_0_0_2px_rgba(226,0,116,0.3)]' : 'border-black/5 dark:border-white/5'} 
            ${isExpanded ? 'shadow-2xl ring-1 ring-black/5 z-20 scale-[1.01]' : 'hover:border-primary/40 hover:shadow-soft-lg'} 
            ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} 
            ${isDragging ? 'opacity-50 scale-95' : ''}
            ${isStale ? 'border-l-[6px] border-l-amber-400' : ''}
            ${!isSwiping ? 'transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)' : 'transition-none'}
        `}
      >
        <div 
            className={`p-5 sm:p-6 ${!isDraggable ? 'cursor-pointer' : ''}`} 
            onClick={!isDraggable ? (e) => { if (Math.abs(swipeOffset) < 5) onToggleExpand(); } : undefined}
        >
            <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3 shrink-0">
                    {!isDraggable && (
                    <div onClick={(e) => e.stopPropagation()} className="relative flex items-center justify-center w-5 h-5">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelect(lead.id)}
                            className="peer appearance-none w-5 h-5 border-2 border-muted-foreground/30 rounded-lg checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                        />
                        <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    )}
                    <div className="hidden sm:block">
                        <UserAvatar name={assignedUser?.displayName} />
                    </div>
                </div>

                <div className="flex-grow min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-foreground text-lg truncate leading-tight">
                            {lead.customerName || 'Unnamed Lead'}
                        </h3>
                        <div className="hidden sm:flex items-center gap-2 opacity-80" title={`Lead Score: ${score}/100`}>
                            <ScoreBar score={score} />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground flex-wrap">
                        {lead.customerPhone && (
                            <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                {lead.customerPhone}
                            </span>
                        )}
                        <span>Updated {new Date(lead.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                        {lead.customerPhone && (
                            <div className="flex gap-2">
                                <button onClick={handleCall} className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                </button>
                                <button onClick={handleSms} className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </button>
                            </div>
                        )}
                        
                        {totals && totals.totalMonthlyInCents > 0 && (
                            <div className="flex items-baseline gap-1 px-3 py-1.5 bg-muted/60 rounded-lg text-sm font-bold text-foreground ml-auto sm:ml-0">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Est.</span>
                                {formatCurrency(totals.totalMonthlyInCents)}
                                <span className="text-[10px] font-medium text-muted-foreground">/mo</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusBadgeClass}`}>
                        {lead.status}
                    </span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${isExpanded ? 'bg-primary text-white rotate-180' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <div className={`transition-all duration-500 ease-in-out bg-muted/20 border-t border-border/50 overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-5">
                        <Select label="Lead Status" name="status" value={status} onChange={(_, val) => setStatus(val as LeadStatus)} options={statusOptions} className="w-full" />
                        <Input label="Follow Up" name="followUpAt" type="datetime-local" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)} />
                        {canReassign && <Select label="Assigned To" name="assignedTo" value={assignedToUid} onChange={(_, val) => setAssignedToUid(val)} options={reassignOptions} className="w-full" />}
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</label>
                            <textarea 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)} 
                                placeholder="Add lead notes..."
                                className="w-full h-32 rounded-2xl bg-background border border-border p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-sm"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                                        {tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-primary/70">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input name="newTag" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={handleTagInputKeyDown} placeholder="Add tag..." className="flex-grow" />
                                <Button size="sm" variant="secondary" onClick={handleAddTag} type="button">Add</Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">History</h4>
                        <div className="max-h-24 overflow-y-auto pr-2 space-y-1">
                            {[...(lead.activityLog || [])].reverse().slice(0, 3).map(renderActivityLog)}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        {lead.versions && lead.versions.length > 0 && (
                            <button 
                                onClick={() => { onLoadLead({ ...lead, versions: [lead.versions![lead.versions!.length - 1]] }); onToggleExpand(); }}
                                className="px-5 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold transition-colors"
                            >
                                Open Quote
                            </button>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</Button>
                        <Button onClick={handleSave} className="shadow-lg shadow-primary/20 rounded-xl">Save Changes</Button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
