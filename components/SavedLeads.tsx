import React from 'react';
import { SavedLead } from '../types';

interface SavedLeadsProps {
  leads: SavedLead[];
  onLoadLead: (lead: SavedLead) => void;
  onDeleteLead: (leadId: string) => void;
}

const SavedLeads: React.FC<SavedLeadsProps> = ({ leads, onLoadLead, onDeleteLead }) => {
  if (leads.length === 0) {
    return <p className="text-center text-muted-foreground">No saved leads yet.</p>;
  }

  return (
    <div className="space-y-3">
      {leads.map(lead => (
        <div key={lead.id} className="bg-muted/50 p-3 rounded-lg flex justify-between items-center transition-colors hover:bg-muted">
          <div>
            <p className="font-semibold text-foreground">{lead.customerName || 'Unnamed Lead'}</p>
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(lead.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLoadLead(lead)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20"
            >
              Load
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the lead for ${lead.customerName || 'this customer'}?`)) {
                  onDeleteLead(lead.id);
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedLeads;
