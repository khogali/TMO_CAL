import React, { useState } from 'react';
import { SavedLead, LeadStatus, UserProfile, Store, UserRole } from '../../types';
import LeadCard from './LeadCard';

interface DetailViewProps {
    onUpdate: (leadId: string, updates: Partial<Pick<SavedLead, 'status' | 'notes' | 'followUpAt' | 'tags' | 'assignedToUid'>>) => void;
    onDelete: (leadId: string) => void;
    onLoadInCalc: (lead: SavedLead) => void;
    userProfile: UserProfile | null;
    allUsers: UserProfile[];
    allStores: Store[];
}
interface BoardViewProps {
  leads: SavedLead[];
  expandedLeadId: string | null;
  onToggleExpand: (leadId: string) => void;
  detailViewProps: DetailViewProps;
  allUsers: UserProfile[];
}

const getStatusColumnBg = (status: LeadStatus) => {
    switch (status) {
        case LeadStatus.NEW: return 'bg-blue-500/5 border-blue-200/20';
        case LeadStatus.CONTACTED: return 'bg-yellow-500/5 border-yellow-200/20';
        case LeadStatus.FOLLOW_UP: return 'bg-purple-500/5 border-purple-200/20';
        case LeadStatus.CLOSED_WON: return 'bg-green-500/5 border-green-200/20';
        case LeadStatus.CLOSED_LOST: return 'bg-red-500/5 border-red-200/20';
        default: return 'bg-muted/50 border-border';
    }
};


const BoardColumn: React.FC<{
  status: LeadStatus;
  leads: SavedLead[];
  expandedLeadId: string | null;
  onToggleExpand: (leadId: string) => void;
  detailViewProps: DetailViewProps;
  allUsers: UserProfile[];
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, status: LeadStatus) => void;
  onDragEnter: (e: React.DragEvent, status: LeadStatus) => void;
  onDragLeave: (e: React.DragEvent) => void;
  isDragOver: boolean;
  draggedLeadId: string | null;
}> = ({ status, leads, expandedLeadId, onToggleExpand, detailViewProps, allUsers, onDragStart, onDragEnd, onDrop, onDragEnter, onDragLeave, isDragOver, draggedLeadId }) => {
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div
      onDrop={(e) => onDrop(e, status)}
      onDragOver={handleDragOver}
      onDragEnter={(e) => onDragEnter(e, status)}
      onDragLeave={onDragLeave}
      className={`w-80 flex-shrink-0 ${getStatusColumnBg(status)} border rounded-2xl p-3 flex flex-col transition-all duration-300 ${isDragOver ? 'bg-primary/5 ring-2 ring-primary ring-inset shadow-soft-lg' : ''}`}
    >
      <h3 className="font-semibold text-foreground px-2 pb-3 flex justify-between items-center select-none">
        <span>{status}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${isDragOver ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/10 text-muted-foreground'}`}>
            {leads.length}
        </span>
      </h3>
      
      <div className="space-y-3 overflow-y-auto flex-grow p-1 -m-1 min-h-[150px] relative scrollbar-hide">
        {leads.map(lead => (
            <div key={lead.id} className={`transition-all duration-300 ease-in-out ${draggedLeadId === lead.id ? 'opacity-40 scale-95 grayscale' : 'opacity-100 scale-100'}`}>
              <LeadCard
                lead={lead}
                assignedUser={allUsers.find(u => u.uid === lead.assignedToUid)}
                isSelected={false}
                onSelect={() => {}}
                onLoadLead={detailViewProps.onLoadInCalc}
                isExpanded={expandedLeadId === lead.id}
                onToggleExpand={() => onToggleExpand(lead.id)}
                isDraggable={true}
                {...detailViewProps}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggedLeadId === lead.id}
              />
            </div>
        ))}
        
        {isDragOver && (
            <div className="h-28 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center animate-pulse transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary/60 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-sm font-semibold text-primary">Drop to move to {status}</span>
            </div>
        )}
      </div>
    </div>
  );
};


const BoardView: React.FC<BoardViewProps> = ({ leads, expandedLeadId, onToggleExpand, detailViewProps, allUsers }) => {
  const columns = Object.values(LeadStatus);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };
  
  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStatus(null);
  };

  const handleDragEnter = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (dragOverStatus !== status) {
        setDragOverStatus(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we are leaving the column element itself, not entering a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverStatus(null);
    }
  };
  
  const handleDrop = (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const droppedLead = leads.find(l => l.id === leadId);

    if (droppedLead && droppedLead.status !== newStatus) {
      detailViewProps.onUpdate(leadId, { status: newStatus });
    }
    
    handleDragEnd();
  };

  const leadsByStatus = columns.reduce((acc, status) => {
    acc[status] = leads.filter(lead => lead.status === status);
    return acc;
  }, {} as Record<LeadStatus, SavedLead[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 snap-x snap-mandatory">
      {columns.map(status => (
        <div key={status} className="snap-center">
            <BoardColumn
            status={status}
            leads={leadsByStatus[status]}
            expandedLeadId={expandedLeadId}
            onToggleExpand={onToggleExpand}
            detailViewProps={detailViewProps}
            allUsers={allUsers}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            isDragOver={dragOverStatus === status}
            draggedLeadId={draggedLeadId}
            />
        </div>
      ))}
    </div>
  );
};

export default BoardView;