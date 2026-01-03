
import React, { useState, useEffect } from 'react';
import { getSavedQuotes } from '../../utils/customerUtils';
import Button from '../ui/Button';
import AdBanner from './ui/AdBanner';

interface SavedQuotesProps {
    onLoad: (config: any) => void;
    onBack: () => void;
}

const SavedQuotes: React.FC<SavedQuotesProps> = ({ onLoad, onBack }) => {
    const [saved, setSaved] = useState<any[]>([]);

    useEffect(() => {
        setSaved(getSavedQuotes());
    }, []);

    return (
        <div className="max-w-lg mx-auto p-4 animate-page-slide-in-right">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Quotes</h2>
                <Button variant="ghost" size="sm" onClick={onBack}>Back</Button>
            </div>

            {saved.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p>No saved quotes found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {saved.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{item.summary.plan}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(item.date).toLocaleDateString()} • ${item.summary.monthly/100}/mo
                                </p>
                            </div>
                            <Button size="sm" onClick={() => onLoad(item.config)}>View</Button>
                        </div>
                    ))}
                </div>
            )}
            
            <AdBanner slotId="saved-quotes-bottom" />
        </div>
    );
};

export default SavedQuotes;
