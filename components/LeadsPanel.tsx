import React from 'react';
import { SavedLead } from '../types';
import SavedLeads from './SavedLeads';
import BottomSheet from './ui/BottomSheet';

interface LeadsPanelProps {
  leads: SavedLead[];
  onLoadLead: (lead: SavedLead) => void;
  onDeleteLead: (leadId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const LeadsPanel: React.FC<LeadsPanelProps> = ({ leads, onLoadLead, onDeleteLead, onClose, isOpen }) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Saved Leads (${leads.length})`}>
      <div className="overflow-y-auto p-4 sm:p-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
          <SavedLeads
              leads={leads}
              onLoadLead={onLoadLead}
              onDeleteLead={onDeleteLead}
          />
      </div>
    </BottomSheet>
  );
};

export default LeadsPanel;