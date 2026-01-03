
import React from 'react';
import { AFFILIATE_ITEMS } from '../../../utils/customerUtils';
import Button from '../../ui/Button';

const AffiliateSection: React.FC = () => {
  const trackClick = (id: string) => {
    console.log(`[Analytics] Affiliate click: ${id}`);
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recommended Essentials</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AFFILIATE_ITEMS.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm flex flex-col">
            <div className="flex-1 mb-3">
                <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
            </div>
            <div className="flex items-center justify-between mt-auto">
                <span className="font-semibold text-gray-900 dark:text-white">{item.price}</span>
                <a 
                    href={item.affiliateUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => trackClick(item.id)}
                    className="text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    View Deal
                </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AffiliateSection;
