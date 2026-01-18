
import { useEffect, useRef } from 'react';

export const useScrollLock = (isOpen: boolean) => {
  const scrollY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      // Record current scroll position
      scrollY.current = window.scrollY;
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'hidden';
      
      // Compensate for scrollbar if it exists
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      // Restore body scroll
      const scrollYValue = scrollY.current;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      document.body.style.paddingRight = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollYValue);
    }

    return () => {
      // Cleanup on unmount
      if (isOpen) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflowY = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollY.current);
      }
    };
  }, [isOpen]);
};
