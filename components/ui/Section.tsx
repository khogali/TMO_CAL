import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; }> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader 
        className={`border-b border-border cursor-pointer transition-colors hover:bg-muted/50 ${isOpen ? '' : 'border-b-0'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex justify-between items-center">
            <CardTitle className={icon ? "flex items-center gap-3" : ""}>
            {icon}
            <span>{title}</span>
            </CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
      </CardHeader>
      <div className={`transition-[max-height,padding] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-none' : 'max-h-0'}`}>
        <CardContent className={`${isOpen ? 'pt-6' : 'pt-0'}`}>
          {children}
        </CardContent>
      </div>
    </Card>
  );
}

export default Section;