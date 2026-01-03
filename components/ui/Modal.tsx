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
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.2 }}
              aria-hidden="true"
              onClick={onClose}
            />

            <motion.div 
              className={`relative z-10 w-full max-h-full flex flex-col bg-card shadow-xl rounded-2xl overflow-hidden ${className.includes('max-w-') ? '' : 'sm:max-w-lg'} ${className}`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-1 overflow-y-auto overscroll-contain">
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