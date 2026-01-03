import React, { useState } from 'react';
import { Promotion, PromotionCategory } from '../../types';
import { useUI, useAuth, useData } from '../../context/AppContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

// Helper function to get an appropriate icon for each promotion category
const getPromoIcon = (category: PromotionCategory) => {
    switch (category) {
        case PromotionCategory.DEVICE: return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
        );
        case PromotionCategory.BTS: return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7"></circle><polyline points="12 9 12 12 13.5 13.5"></polyline><path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"></path></svg>
        );
        case PromotionCategory.PLAN: return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        );
        case PromotionCategory.ACCOUNT: return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        );
        default: return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        );
    }
};

const PromoListItem: React.FC<{ promo: Promotion; onClick: () => void }> = ({ promo, onClick }) => {
    // Generate distinct color themes based on the ID for variety
    const getTheme = (id: string) => {
        const themes = [
            { iconBg: 'bg-rose-100 dark:bg-rose-900/40', iconText: 'text-rose-600 dark:text-rose-400' },
            { iconBg: 'bg-indigo-100 dark:bg-indigo-900/40', iconText: 'text-indigo-600 dark:text-indigo-400' },
            { iconBg: 'bg-sky-100 dark:bg-sky-900/40', iconText: 'text-sky-600 dark:text-sky-400' },
            { iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconText: 'text-emerald-600 dark:text-emerald-400' },
        ];
        return themes[id.charCodeAt(id.length - 1) % themes.length];
    };

    const theme = getTheme(promo.id);

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center p-3 sm:p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:bg-muted/40 transition-all duration-200 text-left group"
        >
            {/* Icon */}
            <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center ${theme.iconBg} ${theme.iconText} mr-4 transition-transform group-hover:scale-105`}>
                <div className="w-6 h-6">
                    {getPromoIcon(promo.category)}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground truncate leading-tight">
                        {promo.name}
                    </h3>
                    {promo.spotlightOnHome && (
                        <span className="flex h-2 w-2 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate pr-2">
                    <span className="font-semibold text-foreground/80">{promo.category}</span>
                    <span className="mx-1.5 opacity-50">•</span>
                    {promo.description}
                </p>
            </div>

            {/* Action Icon */}
            <div className="text-muted-foreground/50 group-hover:text-primary transition-colors pl-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
};

interface PromotionsSpotlightProps {
  promotions: Promotion[];
}

const PromotionsSpotlight: React.FC<PromotionsSpotlightProps> = ({ promotions }) => {
    const { handleUsePromo } = useData();
    const { user } = useAuth();
    const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);

    const handleBuildQuote = () => {
        if (selectedPromo) {
            handleUsePromo(selectedPromo.id);
            setSelectedPromo(null);
        }
    };

    if (promotions.length === 0) return null;

    return (
        <section className="relative">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold text-foreground">Featured Promotions</h2>
            </div>

            <div className="flex flex-col gap-3">
                {promotions.map(promo => (
                    <PromoListItem key={promo.id} promo={promo} onClick={() => setSelectedPromo(promo)} />
                ))}
            </div>

            {/* Detail Modal */}
            <Modal isOpen={!!selectedPromo} onClose={() => setSelectedPromo(null)} className="max-w-lg bg-card rounded-3xl overflow-hidden max-h-[85vh]">
                {selectedPromo && (
                    <>
                        {/* Modal Header / Banner */}
                        <div className="relative h-40 bg-gradient-to-r from-primary to-pink-600 text-white p-6 flex flex-col justify-end overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 opacity-90">
                                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-md">{selectedPromo.category}</span>
                                </div>
                                <h2 className="text-2xl font-bold leading-tight">{selectedPromo.name}</h2>
                            </div>
                            <button 
                                onClick={() => setSelectedPromo(null)}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <div className="prose prose-sm dark:prose-invert">
                                <p className="text-lg text-foreground font-medium mb-4 leading-relaxed">{selectedPromo.description}</p>
                                
                                <div className="space-y-4">
                                    {selectedPromo.conditions && selectedPromo.conditions.length > 0 && (
                                        <div className="bg-muted/50 p-4 rounded-xl border border-border">
                                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Conditions</h4>
                                            <ul className="text-sm space-y-1 list-disc list-inside text-foreground">
                                                {selectedPromo.conditions.map((cond, i) => (
                                                    <li key={i}>
                                                        {cond.field} {cond.operator.replace('_', ' ')} {String(cond.value)}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    {selectedPromo.deviceRequirements && (
                                        <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                                            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Requirements</h4>
                                            <ul className="text-sm space-y-1 text-foreground">
                                                <li className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${selectedPromo.deviceRequirements.tradeIn !== 'Not Allowed' ? 'bg-blue-500' : 'bg-muted-foreground'}`}></span>
                                                    Trade-In: <strong>{selectedPromo.deviceRequirements.tradeIn}</strong>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${selectedPromo.deviceRequirements.newLineRequired ? 'bg-blue-500' : 'bg-muted-foreground'}`}></span>
                                                    New Line: <strong>{selectedPromo.deviceRequirements.newLineRequired ? 'Required' : 'Not Required'}</strong>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-border bg-muted/20 flex gap-3 shrink-0">
                            <Button variant="secondary" onClick={() => setSelectedPromo(null)} className="flex-1">Close</Button>
                            {/* Allow applying any promo type since logic is now generic in applyPromoToConfig */}
                            {user && (
                                <Button onClick={handleBuildQuote} className="flex-[2]">Build Quote with Promo</Button>
                            )}
                        </div>
                    </>
                )}
            </Modal>
        </section>
    );
};

export default PromotionsSpotlight;
