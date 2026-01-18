
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  view: string;
}

const variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
};

const transition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.25,
};

const PageTransition: React.FC<PageTransitionProps> = ({ children, view }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
        // Force full size to prevent content collapse
        className="w-full h-full flex flex-col overflow-hidden"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
