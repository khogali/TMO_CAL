
import React from 'react';

interface AdBannerProps {
  slotId: string;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ slotId, className = '' }) => {
  return (
    <div className={`w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex items-center justify-center p-4 my-4 ${className}`}>
      <div className="text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Advertisement</p>
        <div className="h-16 w-full max-w-[320px] mx-auto bg-gray-200 dark:bg-gray-700 rounded border border-dashed border-gray-400 flex items-center justify-center">
            <span className="text-gray-500 text-xs">Ad Slot: {slotId}</span>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
