import React, { useState, useMemo } from 'react';
import { QuoteConfig, GuidanceItem, GuidancePlacement, GuidanceStyle } from '../../types';
import { checkGuidanceCondition } from '../../utils/guidanceUtils';

interface GuidanceDisplayProps {
    items: GuidanceItem[];
    config: QuoteConfig;
    placement: GuidancePlacement;
}

const GuidanceDisplay: React.FC<GuidanceDisplayProps> = ({ items, config, placement }) => {
    const [dismissedItems, setDismissedItems] = useState<string[]>([]);

    const applicableItems = useMemo(() => {
        return items.filter(item => 
            item.isActive && 
            item.placement === placement && 
            !dismissedItems.includes(item.id) &&
            (item.conditions || []).every(cond => checkGuidanceCondition(config, cond))
        );
    }, [items, config, placement, dismissedItems]);

    if (applicableItems.length === 0) return null;

    const getStyleClasses = (style: GuidanceStyle) => {
        switch(style) {
            case GuidanceStyle.SUCCESS: return 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300';
            case GuidanceStyle.WARNING: return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300';
            case GuidanceStyle.PROMO: return 'bg-primary/10 border-primary/20 text-primary';
            case GuidanceStyle.INFO: default: return 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300';
        }
    }

    return (
        <div className="space-y-3">
            {applicableItems.map(item => (
                <div key={item.id} className={`p-4 rounded-2xl border flex items-start gap-4 animate-fade-in-down ${getStyleClasses(item.style)}`}>
                    <div className="flex-grow">
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm mt-1" dangerouslySetInnerHTML={{ __html: item.message }}></p>
                    </div>
                    <button onClick={() => setDismissedItems(prev => [...prev, item.id])} className="text-inherit opacity-70 hover:opacity-100 flex-shrink-0">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ))}
        </div>
    );
};

export default GuidanceDisplay;
