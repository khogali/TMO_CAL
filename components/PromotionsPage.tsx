
/* ... existing imports ... */
import React, { useState, useMemo } from 'react';
import { useData, useUI } from '../context/AppContext';
import { Promotion, PromotionCategory, TradeInRequirement, StackingGroup } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { analyzePromotion } from '../utils/conditionUtils';
import { solveBestStack } from '../utils/optimization';
import MobileAppShell from './ui/MobileAppShell';

/* ... existing icon helpers and PromotionRow/HeroCard/Modal components ... */
// --- ICONS & THEMES ---

const getCategoryTheme = (category: PromotionCategory) => {
    switch (category) {
        case PromotionCategory.DEVICE: return { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' };
        case PromotionCategory.PLAN: return { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300' };
        case PromotionCategory.BUNDLE: return { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' };
        case PromotionCategory.BTS: return { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300' };
        case PromotionCategory.REIMBURSEMENT: return { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' };
        default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
    }
};

const getPromoIcon = (category: PromotionCategory) => {
    if (category === PromotionCategory.BUNDLE) return <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
    if (category === PromotionCategory.DEVICE) return <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>;
    if (category === PromotionCategory.PLAN) return <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10z"></path><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>;
    if (category === PromotionCategory.REIMBURSEMENT) return <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
};

// --- LIST ROW COMPONENT ---

const PromotionRow: React.FC<{ 
    promo: Promotion; 
    status: 'eligible' | 'near_miss'; 
    fixAction?: string;
    onApply: () => void; 
    onViewDetails: () => void;
    isCatalogMode: boolean;
}> = ({ promo, status, fixAction, onApply, onViewDetails, isCatalogMode }) => {
    const theme = getCategoryTheme(promo.category);
    // Only lock if we are NOT in catalog mode AND the status is near_miss
    const isLocked = !isCatalogMode && status === 'near_miss';
    
    return (
        <div 
            onClick={onViewDetails}
            className={`
                relative flex items-center gap-4 py-4 px-4 bg-card border-b border-border/60 hover:bg-muted/30 active:bg-muted/50 transition-colors cursor-pointer last:border-b-0
                ${isLocked ? 'opacity-80 grayscale-[0.3]' : ''}
            `}
        >
            {/* Icon */}
            <div className={`
                shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm relative
                ${isLocked ? 'bg-muted text-muted-foreground' : `${theme.bg} ${theme.text}`}
            `}>
                <div className="w-6 h-6">
                    {getPromoIcon(promo.category)}
                </div>
                {isLocked && (
                    <div className="absolute -top-1 -right-1 bg-card rounded-full p-0.5 border border-border shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`font-bold text-base leading-tight truncate ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {promo.name}
                    </h3>
                </div>
                
                <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    {isLocked ? (
                        <span className="text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1">
                            Requires: {fixAction || 'Check Details'}
                        </span>
                    ) : (
                        <span className="truncate">{promo.description}</span>
                    )}
                </div>
                
                {/* Badges Row */}
                {!isLocked && (promo.spiff || promo.deviceRequirements?.tradeIn === TradeInRequirement.REQUIRED) && (
                    <div className="flex gap-2 mt-1.5">
                        {promo.spiff && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-md">
                                +${promo.spiff} Spiff
                            </span>
                        )}
                        {promo.deviceRequirements?.tradeIn === TradeInRequirement.REQUIRED && (
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                                Trade-In Req
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="shrink-0 pl-1">
                <Button 
                    size="sm" 
                    className={`
                        h-8 rounded-full px-4 text-xs font-bold shadow-none transition-all
                        ${isLocked 
                            ? 'bg-transparent text-amber-600 border border-amber-200 dark:border-amber-800 hover:bg-amber-50 hover:text-amber-700' 
                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                        }
                    `}
                    onClick={(e) => { e.stopPropagation(); onApply(); }}
                >
                    {isLocked ? 'Unlock' : (isCatalogMode ? 'Use Deal' : 'Apply')}
                </Button>
            </div>
        </div>
    );
};

const HeroCard: React.FC<{ promo: Promotion; onApply: () => void }> = ({ promo, onApply }) => {
    return (
        <div className="px-4 py-4">
            <div 
                onClick={onApply}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg cursor-pointer transform active:scale-[0.98] transition-all duration-200"
            >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider mb-2">
                                Recommended
                            </span>
                            <h2 className="text-xl font-bold leading-tight">{promo.name}</h2>
                            <p className="text-sm text-emerald-100 leading-relaxed max-w-xs opacity-90 pt-1">
                                {promo.description}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        {promo.spiff ? (
                            <span className="text-xs font-bold bg-emerald-500/30 px-2 py-1 rounded-lg border border-emerald-400/20">
                                +${promo.spiff} Spiff
                            </span>
                        ) : <span></span>}
                        <button className="bg-white text-emerald-700 px-4 py-2 rounded-full font-bold text-xs shadow-md">
                            Start Quote
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PromoDetailModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    promo: Promotion | null;
    onApply: () => void;
}> = ({ isOpen, onClose, promo, onApply }) => {
    if (!promo) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="relative bg-muted/30 p-6 border-b border-border flex-shrink-0">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md mb-2">
                            {promo.category}
                        </span>
                        <h2 className="text-xl font-bold text-foreground leading-tight">{promo.name}</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Details</h4>
                        <p className="text-base text-foreground leading-relaxed">{promo.description}</p>
                    </div>
                    
                    {(promo.conditions?.length > 0 || promo.deviceRequirements) && (
                        <div className="bg-muted/30 p-4 rounded-2xl border border-border space-y-4">
                            {promo.conditions && promo.conditions.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-foreground mb-2">Conditions</h4>
                                    <ul className="text-sm space-y-2 text-muted-foreground">
                                        {promo.conditions.map((cond, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                                <span>
                                                    <span className="font-medium text-foreground">{cond.field}</span> {cond.operator.replace('_', ' ')} <span className="font-mono bg-background px-1 rounded border border-border/50 text-xs">{String(cond.value)}</span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {promo.deviceRequirements && (
                                <div>
                                    <h4 className="text-xs font-bold text-foreground mb-2">Requirements</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-background rounded-xl border border-border/50 text-center">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Trade-In</p>
                                            <p className="font-semibold text-foreground">{promo.deviceRequirements.tradeIn}</p>
                                        </div>
                                        <div className="p-3 bg-background rounded-xl border border-border/50 text-center">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">New Line</p>
                                            <p className="font-semibold text-foreground">{promo.deviceRequirements.newLineRequired ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 flex gap-3">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div>
                            <span className="font-bold block mb-0.5">Stacking Rule: {promo.stackingGroup || 'Open'}</span>
                            <span className="opacity-90 leading-relaxed">
                                {promo.stackingGroup === StackingGroup.OPEN 
                                    ? "Combinable with other offers." 
                                    : "Limited to one offer per group."}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-border bg-background/95 backdrop-blur flex gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <Button variant="secondary" onClick={onClose} className="flex-1 rounded-xl h-12 font-bold">Close</Button>
                <Button onClick={() => { onApply(); onClose(); }} className="flex-[2] rounded-xl h-12 font-bold shadow-lg">
                    Apply Promotion
                </Button>
            </div>
        </Modal>
    );
};

// --- MAIN PAGE ---

const PromotionsPage: React.FC = () => {
    const { 
        promotions, 
        handleUsePromo, 
        wizardConfig,
        applyWizardConfig,
        planPricing,
        servicePlans,
        discountSettings,
        insurancePlans,
        deviceDatabase,
        sessionQuote // NEW: Check if there's an active calculator session
    } = useData();
    const { setToastMessage } = useUI();
    
    const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
    const [activeCategory, setActiveCategory] = useState<'ALL' | PromotionCategory>('ALL');

    // If sessionQuote is present, we use it for validation. Otherwise, we use a mock config but display in Catalog Mode.
    const isValidationMode = !!sessionQuote;
    
    const configToAnalyze = sessionQuote || wizardConfig || {
        customerName: '', customerPhone: '', customerType: 'Standard', plan: 'essentials', lines: 1, devices: [], accessories: [], discounts: { autopay: true, insider: false, thirdLineFree: false }, fees: { activation: false }, taxRate: 0, maxEC: 0, perLineEC: 0
    };

    const analyzedPromotions = useMemo(() => {
        return promotions.map(p => {
            const analysis = analyzePromotion(configToAnalyze as any, p);
            return { promo: p, ...analysis };
        });
    }, [promotions, configToAnalyze]);

    const reimbursementOffers = analyzedPromotions.filter(a => a.promo.category === PromotionCategory.REIMBURSEMENT && a.promo.isActive);
    
    // Unified list logic
    const unifiedDeals = useMemo(() => {
        return analyzedPromotions
            .filter(a => 
                // Must be active
                a.promo.isActive && 
                // Exclude reimbursement (shown in hero)
                a.promo.category !== PromotionCategory.REIMBURSEMENT &&
                // If in Validation Mode: Status must be eligible or near_miss
                // If in Catalog Mode: Show everything that isn't strictly hidden by hard constraints
                (isValidationMode ? (a.status === 'eligible' || a.status === 'near_miss') : a.status !== 'hidden')
            )
            .filter(d => activeCategory === 'ALL' || d.promo.category === activeCategory)
            .sort((a, b) => {
                // If validating, put Eligible first
                if (isValidationMode && a.status !== b.status) return a.status === 'eligible' ? -1 : 1;
                // Otherwise sort by Priority
                return (b.promo.priority || 0) - (a.promo.priority || 0);
            });
    }, [analyzedPromotions, activeCategory, isValidationMode]);

    const handleAutoMaximize = () => {
        const currentConfig = sessionQuote || wizardConfig || configToAnalyze as any;
        const { config: optimizedConfig, savingsInCents, promosApplied } = solveBestStack(
            currentConfig,
            promotions,
            planPricing,
            servicePlans,
            discountSettings,
            insurancePlans,
            deviceDatabase
        );

        if (savingsInCents > 0) {
            applyWizardConfig(optimizedConfig);
            setToastMessage(`Saved $${(savingsInCents / 100).toFixed(0)}/mo! Applied ${promosApplied.length} promos.`);
        } else {
            setToastMessage("Already maximized! No better combination found.");
        }
    };

    const categories = [
        { id: 'ALL', label: 'All' },
        { id: PromotionCategory.DEVICE, label: 'Phones' },
        { id: PromotionCategory.PLAN, label: 'Plans' },
        { id: PromotionCategory.BUNDLE, label: 'Bundles' },
        { id: PromotionCategory.BTS, label: 'BTS' }
    ];

    return (
        <MobileAppShell>
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="px-4 py-3 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-black text-foreground tracking-tight">Offers</h1>
                        {isValidationMode && <p className="text-[10px] text-primary font-bold animate-pulse">● Validating Quote</p>}
                    </div>
                    {isValidationMode && (
                        <Button 
                            onClick={handleAutoMaximize}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-white border-0 shadow-sm rounded-full font-bold px-4 h-8 text-xs"
                        >
                            ✨ Auto-Max
                        </Button>
                    )}
                </div>
                
                {/* Categories */}
                <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 pb-3">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as any)}
                            className={`
                                px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                                    ${activeCategory === cat.id 
                                    ? 'bg-foreground text-background border-foreground shadow-sm' 
                                    : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
                                }
                            `}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto pb-40">
                
                {/* Hero Section */}
                {reimbursementOffers.map(item => (
                    <HeroCard key={item.promo.id} promo={item.promo} onApply={() => handleUsePromo(item.promo.id)} />
                ))}

                {/* Unified Promotions List */}
                <div className="mt-2">
                    {unifiedDeals.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🏷️</div>
                            <p className="text-sm font-medium text-foreground">No promotions found</p>
                            <p className="text-xs text-muted-foreground mt-1">Try changing the category filter.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40 border-t border-border/40">
                            {unifiedDeals.map((item) => (
                                <PromotionRow
                                    key={item.promo.id}
                                    promo={item.promo}
                                    status={item.status as any}
                                    fixAction={item.fixAction}
                                    onApply={() => handleUsePromo(item.promo.id)}
                                    onViewDetails={() => setSelectedPromo(item.promo)}
                                    isCatalogMode={!isValidationMode}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <PromoDetailModal 
                isOpen={!!selectedPromo}
                onClose={() => setSelectedPromo(null)}
                promo={selectedPromo}
                onApply={() => selectedPromo && handleUsePromo(selectedPromo.id)}
            />
        </MobileAppShell>
    );
};

export default PromotionsPage;
