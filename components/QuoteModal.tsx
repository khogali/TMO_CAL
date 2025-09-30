import React, { useRef, useEffect } from 'react';

interface QuoteModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const QuoteModal: React.FC<QuoteModalProps> = ({ onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-start justify-center p-4 pt-12 animate-fade-in-down lg:hidden">
      <div 
        ref={modalRef} 
        className="bg-background/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg border border-border flex flex-col max-h-[calc(100vh-4rem)]"
      >
        <div className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-foreground">Quote Summary</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close quote summary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;