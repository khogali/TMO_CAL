
import React from 'react';
import Portal from './Portal';
import { useScrollLock } from '../../hooks/useScrollLock';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' },
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className = '' }) => {
  useScrollLock(isOpen);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            aria-labelledby="modal-title" 
            role="dialog" 
            aria-modal="true"
            style={{ height: '100dvh', maxHeight: '-webkit-fill-available' }}
          >
            <motion.div 
              className="absolute inset-0 bg-black/40 backdrop-blur-md touch-none" 
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.3 }}
              aria-hidden="true"
              onClick={onClose}
            />

            <motion.div 
              className={`relative z-10 w-full flex flex-col bg-card/90 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] border border-white/20 overflow-hidden ${className.includes('max-w-') ? '' : 'sm:max-w-lg'} ${className}`}
              style={{ maxHeight: 'calc(100dvh - 3rem)' }}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
                    {children}
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default Modal;
