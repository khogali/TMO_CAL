import React, { useState, useMemo } from 'react';
import { SavedLead, LeadStatus, ActivityLogEntry, ActivityLogType, QuoteVersion, UserProfile, Store, UserRole } from '../../types';
import Select from '../ui/Select';
import Input from '../ui/Input';

interface LeadDetailInlineProps {
  lead: SavedLead;
  onClose: () => void;
  onUpdate: (leadId: string, updates: Partial<Pick<SavedLead, 'status' | 'notes' | 'followUpAt' | 'tags' | 'assignedToUid'>>) => void;
  onDelete: (leadId: string) => void;
  onLoadInCalc: (lead: SavedLead) => void;
  userProfile: UserProfile | null;
  allUsers: UserProfile[];
  allStores: Store[];
}

const formatCurrency = (amountInCents: number) => {
    return (amountInCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const LeadDetailInline: React.FC<LeadDetailInlineProps> = ({ lead, onClose, onUpdate, onDelete, onLoadInCalc, userProfile, allUsers, allStores }) => {
    const [notes, setNotes] = useState(lead.notes);
    const [status, setStatus] = useState(lead.status);
    const [followUpAt, setFollowUpAt] = useState(lead.followUpAt ? new Date(lead.followUpAt).toISOString().substring(0, 16) : '');
    const [assignedToUid, setAssignedToUid] = useState(lead.assignedToUid);
    
    const handleSave = () => {
        onUpdate(lead.id, {
            notes,
            status,
            followUpAt: followUpAt ? new Date(followUpAt).getTime() : undefined,
            assignedToUid: assignedToUid,
        });
        onClose();
    };

    const handleDelete = () => {
        if(window.confirm('Are you sure you want to delete this lead?')) {
            onDelete(lead.id);
            onClose();
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
             <div key={entry.id} className="flex gap-3 items-center">
                <div className="text-muted-foreground text-xs whitespace-nowrap">{new Date(entry.timestamp).toLocaleDateString()}</div>
                <div className="w-1 h-1 bg-border rounded-full"></div>
                <div className="text-xs text-foreground">{content}</div>
             </div>
        )
    }

    const canReassign = userProfile && [UserRole.ADMIN, UserRole.DISTRICT_MANAGER, UserRole.STORE_MANAGER].includes(userProfile.role);
    
    const reassignableUsers = useMemo(() => {
        if (!canReassign || !userProfile) return [];
        switch (userProfile.role) {
            case UserRole.ADMIN:
                return allUsers;
            case UserRole.DISTRICT_MANAGER:
                return allUsers.filter(u => userProfile.managedStoreIds?.includes(u.storeId || ''));
            case UserRole.STORE_MANAGER:
                return allUsers.filter(u => u.storeId === userProfile.storeId);
            default:
                return [];
        }
    }, [canReassign, userProfile, allUsers]);

    const reassignOptions = reassignableUsers.map(u => ({ value: u.uid, label: u.displayName }));

    const statusOptions = Object.values(LeadStatus).map(s => ({ value: s, label: s }));

  return (
    <div className="bg-muted/30 p-4 border-t border-border animate-fade-in-down -mt-1 rounded-b-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
                <Select
                    label="Status"
                    name="status"
                    value={status}
                    onChange={(_, val) => setStatus(val as LeadStatus)}
                    options={statusOptions}
                />
                 {canReassign && (
                    <Select 
                        label="Assigned To"
                        name="assignedTo"
                        value={assignedToUid}
                        onChange={(_, val) => setAssignedToUid(val)}
                        options={reassignOptions}
                    />
                 )}
                <Input
                    label="Follow-up Date"
                    name="followUpAt"
                    type="datetime-local"
                    value={followUpAt}
                    onChange={e => setFollowUpAt(e.target.value)}
                />
            </div>
            <div>
                 <label className="block text-sm font-medium text-muted-foreground mb-2">Notes</label>
                <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    rows={canReassign ? 9 : 6} 
                    className="block w-full rounded-xl border-none bg-muted px-4 py-3 focus:bg-card focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-200 text-base sm:text-sm text-foreground" 
                />
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border space-y-4">
            <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Quote Versions</h4>
                <div className="space-y-2">
                    {(lead.versions || []).map((v: QuoteVersion, i) => (
                        <div key={v.versionCreatedAt} className="p-2 bg-muted rounded-lg text-sm flex justify-between items-center">
                            <div>
                                <span className="font-semibold">Version {i + 1}</span>
                                <span className="text-muted-foreground text-xs ml-2">({new Date(v.versionCreatedAt).toLocaleDateString()})</span>
                                <span className="font-bold text-primary ml-4">{formatCurrency(v.calculatedTotals?.totalMonthlyInCents || 0)}/mo</span>
                            </div>
                            <button onClick={() => { onLoadInCalc({ ...lead, versions: [v] }); onClose(); }} className="text-xs font-semibold text-primary hover:underline">Load</button>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Activity Log</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto p-2 bg-muted rounded-lg">
                    {[...(lead.activityLog || [])].reverse().map(renderActivityLog)}
                </div>
            </div>
        </div>
        <footer className="mt-4 pt-4 border-t border-border flex justify-between items-center flex-shrink-0">
            <button onClick={handleDelete} className="text-sm font-semibold text-red-500 hover:bg-red-500/10 p-2 rounded-lg">Delete Lead</button>
            <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg bg-muted hover:bg-border">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-pink-700">Save Changes</button>
            </div>
        </footer>
    </div>
  );
};

export default LeadDetailInline;