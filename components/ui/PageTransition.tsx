
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  view: string;
}

const variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
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
        className="w-full h-full flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
