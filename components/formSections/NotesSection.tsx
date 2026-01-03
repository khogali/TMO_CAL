import React from 'react';
import { QuoteConfig } from '../../types';
import Section from '../ui/Section';

interface NotesSectionProps {
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
}

const NotesSection: React.FC<NotesSectionProps> = ({ config, setConfig }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Section title="Lead Notes" defaultOpen={false} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}>
      <textarea name="notes" value={config.notes || ''} onChange={handleInputChange} placeholder="Add customer notes, or let the AI generate a summary..." rows={4} className="block w-full rounded-xl border border-muted bg-muted shadow-sm hover:border-border focus:bg-card focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-200 text-base sm:text-sm text-foreground p-4" />
    </Section>
  );
};

export default NotesSection;