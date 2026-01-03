import React from 'react';
import { SavedLead, UserProfile, Store, UserRole } from '../../types';
import LeadCard from './LeadCard';

interface DetailViewProps {
    onUpdate: (leadId: string, updates: Partial<Pick<SavedLead, 'status' | 'notes' | 'followUpAt' | 'tags' | 'assignedToUid'>>) => void;
    onDelete: (leadId: string) => void;
    onLoadInCalc: (lead: SavedLead) => void;
    userProfile: UserProfile | null;
    allUsers: UserProfile[];
    allStores: Store[];
}
interface ListViewProps {
  leads: SavedLead[];
  selectedLeads: string[];
  onSelectLead: (leadId: string) => void;
  onSelectAll: () => void;
  expandedLeadId: string | null;
  onToggleExpand: (leadId: string) => void;
  detailViewProps: DetailViewProps;
  allUsers: UserProfile[];
}

const ListView: React.FC<ListViewProps> = ({ 
    leads, 
    selectedLeads, 
    onSelectLead, 
    onSelectAll, 
    expandedLeadId, 
    onToggleExpand,
    detailViewProps,
    allUsers
}) => {
  if (leads.length === 0) {
    return <p className="text-center text-muted-foreground py-12">No leads match the current filters.</p>;
  }

  const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;

  return (
    <div className="space-y-4">
      <div className="px-4 flex items-center">
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={onSelectAll}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label className="ml-3 text-sm font-medium text-muted-foreground">Select All</label>
      </div>
      <div className="space-y-3">
        {leads.map((lead, index) => (
          <div
            key={lead.id}
            className="animate-stagger-in opacity-0"
            style={{ animationFillMode: 'forwards', animationDelay: `${index * 50}ms` }}
          >
              <LeadCard
                lead={lead}
                assignedUser={allUsers.find(u => u.uid === lead.assignedToUid)}
                isSelected={selectedLeads.includes(lead.id)}
                onSelect={onSelectLead}
                isExpanded={expandedLeadId === lead.id}
                onToggleExpand={() => onToggleExpand(lead.id)}
                onLoadLead={detailViewProps.onLoadInCalc}
                {...detailViewProps}
              />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListView;