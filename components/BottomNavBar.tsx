import React from 'react';

interface BottomNavBarProps {
  onOpenLeads: () => void;
  onOpenAdmin: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onOpenLeads, onOpenAdmin }) => {
  return (
    <footer className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 z-40">
      <nav className="flex justify-around items-center h-16">
        <button
          onClick={onOpenLeads}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-tmobile-magenta dark:text-slate-400 dark:hover:text-tmobile-magenta transition-colors w-full h-full space-y-1 focus:outline-none focus:text-tmobile-magenta"
          aria-label="Open Leads Panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs font-medium">Leads</span>
        </button>
        <button
          onClick={onOpenAdmin}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-tmobile-magenta dark:text-slate-400 dark:hover:text-tmobile-magenta transition-colors w-full h-full space-y-1 focus:outline-none focus:text-tmobile-magenta"
          aria-label="Open Admin Panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium">Admin</span>
        </button>
      </nav>
    </footer>
  );
};

export default BottomNavBar;