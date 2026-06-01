import React, { useRef, useState } from 'react';
import Portal from './Portal';
import { useScrollLock } from '../../hooks/useScrollLock';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  // Apply scroll lock
  useScrollLock(isOpen);

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
      setIsClosing(false);
    }
  };

  const closeSheet = () => {
    setIsClosing(true);
  };
  
  const onTouchStart = (e: React.TouchEvent) => {
    // Only allow dragging if we are at the top of the content
    if (sheetRef.current && sheetRef.current.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        currentY.current = startY.current;
        isDragging.current = true;
        sheetRef.current.style.transition = 'none';
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only allow dragging down
    if (diff > 0) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const onTouchEnd = () => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    sheetRef.current.style.transition = 'transform 0.3s ease-out';
    const diff = currentY.current - startY.current;

    if (diff > 100) { // If dragged more than 100px, close
      closeSheet();
    } else { // Otherwise, snap back
      sheetRef.current.style.transform = 'translateY(0)';
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center pointer-events-none"
        role="dialog"
        aria-modal="true"
        style={{ height: '100dvh', maxHeight: '-webkit-fill-available' }}
      >
        <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
            onClick={closeSheet}
            aria-hidden="true"
        />
        <div
          ref={sheetRef}
          className={`bg-card w-full max-w-md border-t border-border flex flex-col max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl pointer-events-auto overflow-hidden transform transition-transform duration-300 ${isClosing ? 'translate-y-full' : 'translate-y-0'}`}
          onClick={(e) => e.stopPropagation()}
          onAnimationEnd={handleAnimationEnd}
        >
          <div 
            className="p-4 sm:p-5 border-b border-border flex justify-between items-center relative flex-shrink-0 cursor-grab active:cursor-grabbing select-none bg-card z-10"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-muted-foreground/20 rounded-full sm:hidden" />
            <h2 className="text-lg font-bold text-foreground pt-3 sm:pt-0">{title}</h2>
            <button onClick={closeSheet} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] flex-1">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default BottomSheet;