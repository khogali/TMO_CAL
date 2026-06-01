
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
    <Section title="Lead Notes" defaultOpen={false} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>}>
      <textarea name="notes" value={config.notes || ''} onChange={handleInputChange} placeholder="Add customer notes, or let the AI generate a summary..." rows={4} className="block w-full rounded-xl border border-muted bg-muted shadow-sm hover:border-border focus:bg-card focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-200 text-base sm:text-sm text-foreground p-4" />
    </Section>
  );
};

export default NotesSection;
