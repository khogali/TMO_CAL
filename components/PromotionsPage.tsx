import React, { useState, useMemo } from 'react';
import { useData } from '../context/AppContext';
import { Promotion, PromotionCategory, PromotionEffectType, TradeInRequirement, StackingGroup } from '../types';
import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';
import Modal from './ui/Modal';
import Select from './ui/Select';

// --- VISUAL HELPERS ---

const getCategoryTheme = (category: PromotionCategory) => {
    switch (category) {
        case PromotionCategory.DEVICE: 
            return { 
                bg: 'bg-blue-50 dark:bg-blue-900/10', 
                text: 'text-blue-600 dark:text-blue-400', 
                border: 'border-blue-200 dark:border-blue-800',
                gradient: 'from-blue-500 to-indigo-600',
                hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
            };
        case PromotionCategory.PLAN: 
            return { 
                bg: 'bg-pink-50 dark:bg-pink-900/10', 
                text: 'text-pink-600 dark:text-pink-400', 
                border: 'border-pink-200 dark:border-pink-800',
                gradient: 'from-pink-500 to-rose-600',
                hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30'
            };
        case PromotionCategory.BTS: 
            return { 
                bg: 'bg-purple-50 dark:bg-purple-900/10', 
                text: 'text-purple-600 dark:text-purple-400', 
                border: 'border-purple-200 dark:border-purple-800',
                gradient: 'from-purple-500 to-violet-600',
                hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
            };
        case PromotionCategory.ACCESSORY: 
            return { 
                bg: 'bg-teal-50 dark:bg-teal-900/10', 
                text: 'text-teal-600 dark:text-teal-400', 
                border: 'border-teal-200 dark:border-teal-800',
                gradient: 'from-teal-500 to-emerald-600',
                hover: 'hover:bg-teal-100 dark:hover:bg-teal-900/30'
            };
        default: 
            return { 
                bg: 'bg-gray-50 dark:bg-gray-800', 
                text: 'text-gray-600 dark:text-gray-400', 
                border: 'border-gray-200 dark:border-gray-700',
                gradient: 'from-gray-500 to-gray-600',
                hover: 'hover:bg-gray-100 dark:hover:bg-gray-800'
            };
    }
};

const getPromoIcon = (category: PromotionCategory) => {
    switch (category) {
        case PromotionCategory.DEVICE: return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
        );
        case PromotionCategory.BTS: return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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

// --- SUB-COMPONENTS ---

interface PromotionCardProps {
    promo: Promotion;
    onClick: () => void;
    onApply: () => void;
    isSelectedForCompare: boolean;
    onToggleCompare: (e: React.MouseEvent) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promo, onClick, onApply, isSelectedForCompare, onToggleCompare }) => {
    const theme = getCategoryTheme(promo.category);
    const isBogo = !!promo.bogoConfig;
    
    // Calculate estimated value
    let estimatedValue = 0;
    promo.effects.forEach(effect => {
        if (typeof effect.value === 'number') {
             if ([PromotionEffectType.DEVICE_CREDIT_FIXED, PromotionEffectType.DEVICE_INSTANT_REBATE, PromotionEffectType.PLAN_DISCOUNT_FIXED, PromotionEffectType.SERVICE_PLAN_DISCOUNT_FIXED].includes(effect.type)) {
                 estimatedValue += effect.value;
             }
        }
    });

    return (
        <div 
            className={`group relative flex flex-col bg-card rounded-2xl border transition-all duration-300 hover:shadow-lg overflow-hidden cursor-pointer ${isSelectedForCompare ? 'ring-2 ring-primary border-primary' : 'border-border/60 hover:border-primary/30'}`}
            onClick={onClick}
        >
            {/* Top Badge Row */}
            <div className="absolute top-3 left-3 z-10 flex gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${theme.bg} ${theme.text} ${theme.border}`}>
                    {promo.category}
                </span>
                {isBogo && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-indigo-600 text-white shadow-sm">
                        BOGO
                    </span>
                )}
            </div>

            {/* Compare Checkbox */}
            <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                <div 
                    onClick={onToggleCompare}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${isSelectedForCompare ? 'bg-primary border-primary shadow-sm scale-110' : 'bg-background/80 backdrop-blur-sm border-border hover:border-primary hover:scale-105'}`}
                    title="Compare"
                >
                    {isSelectedForCompare ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground opacity-50 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 pt-12 flex-grow flex flex-col">
                {/* Value Highlight */}
                {estimatedValue > 0 && (
                    <div className="mb-2">
                        <span className="text-2xl font-extrabold text-foreground tracking-tight">${estimatedValue}</span>
                        <span className="text-xs font-medium text-muted-foreground ml-1 uppercase">Value</span>
                    </div>
                )}
                
                <h3 className="text-lg font-bold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {promo.name}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {promo.description}
                </p>

                {/* Requirements Micro-badges */}
                <div className="mt-auto flex flex-wrap gap-2 text-[10px] font-medium text-muted-foreground">
                    {promo.deviceRequirements?.tradeIn === TradeInRequirement.REQUIRED && (
                        <span className="bg-muted px-1.5 py-0.5 rounded border border-border">Trade-In Req.</span>
                    )}
                    {promo.deviceRequirements?.newLineRequired && (
                        <span className="bg-muted px-1.5 py-0.5 rounded border border-border">New Line</span>
                    )}
                    <span className="bg-muted px-1.5 py-0.5 rounded border border-border">Group: {promo.stackingGroup}</span>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-3 bg-muted/30 border-t border-border flex gap-2">
                <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    className="flex-1 text-xs h-8"
                >
                    Details
                </Button>
                <Button 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onApply(); }}
                    className={`flex-1 text-xs h-8 bg-gradient-to-r ${theme.gradient} text-white border-0 shadow-sm hover:opacity-90`}
                >
                    Apply
                </Button>
            </div>
        </div>
    );
};

const PromotionListItem: React.FC<PromotionCardProps> = ({ promo, onClick, onApply, isSelectedForCompare, onToggleCompare }) => {
    const theme = getCategoryTheme(promo.category);
    const isBogo = !!promo.bogoConfig;
    
    let estimatedValue = 0;
    promo.effects.forEach(effect => {
        if (typeof effect.value === 'number') {
             if ([PromotionEffectType.DEVICE_CREDIT_FIXED, PromotionEffectType.DEVICE_INSTANT_REBATE, PromotionEffectType.PLAN_DISCOUNT_FIXED, PromotionEffectType.SERVICE_PLAN_DISCOUNT_FIXED].includes(effect.type)) {
                 estimatedValue += effect.value;
             }
        }
    });

    return (
        <div 
            onClick={onClick}
            className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card rounded-xl border transition-all hover:shadow-md cursor-pointer gap-4 ${isSelectedForCompare ? 'ring-1 ring-primary border-primary' : 'border-border hover:border-primary/30'}`}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${theme.bg} ${theme.text}`}>
                    <div className="w-6 h-6">{getPromoIcon(promo.category)}</div>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-foreground text-sm sm:text-base">{promo.name}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${theme.bg} ${theme.text} ${theme.border}`}>
                            {promo.category}
                        </span>
                        {isBogo && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-600 text-white shadow-sm">
                                BOGO
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{promo.description}</p>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                 {estimatedValue > 0 && (
                    <div className="text-left sm:text-right mr-2">
                        <span className="block text-base font-bold text-foreground">${estimatedValue}</span>
                        <span className="text-[10px] uppercase text-muted-foreground block leading-none">Value</span>
                    </div>
                )}
                
                <div 
                    onClick={onToggleCompare}
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${isSelectedForCompare ? 'bg-primary border-primary shadow-sm' : 'bg-background hover:bg-muted border-border'}`}
                    title="Compare"
                >
                    {isSelectedForCompare ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    )}
                </div>

                <Button 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onApply(); }}
                    className={`bg-gradient-to-r ${theme.gradient} text-white border-0 shadow-sm hover:opacity-90 h-9 px-4`}
                >
                    Apply
                </Button>
            </div>
        </div>
    );
};

const FeaturedPromo: React.FC<{ promo: Promotion; onApply: () => void }> = ({ promo, onApply }) => {
    const theme = getCategoryTheme(promo.category);
    let estimatedValue = 0;
    promo.effects.forEach(effect => {
        if (typeof effect.value === 'number' && [PromotionEffectType.DEVICE_CREDIT_FIXED, PromotionEffectType.DEVICE_INSTANT_REBATE].includes(effect.type)) {
            estimatedValue += effect.value;
        }
    });

    return (
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} text-white shadow-xl mb-12`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center p-8 md:p-12 gap-8">
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10 shadow-sm">
                        <span className="animate-pulse w-2 h-2 rounded-full bg-white"></span>
                        Deal of the Day
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
                        {promo.name}
                    </h2>
                    <p className="text-lg md:text-xl text-white/90 max-w-xl leading-relaxed font-medium">
                        {promo.description}
                    </p>
                    <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <Button 
                            onClick={onApply}
                            className="bg-white text-gray-900 hover:bg-gray-50 border-0 h-12 px-8 rounded-xl font-bold shadow-lg text-base"
                        >
                            Start Quote with this Deal
                        </Button>
                        <div className="flex items-center gap-4 px-5 py-2 bg-black/20 rounded-xl backdrop-blur-sm border border-white/10">
                            <div className="text-left">
                                <p className="text-[10px] uppercase font-bold text-white/60">Max Value</p>
                                <p className="text-xl font-bold">${estimatedValue > 0 ? estimatedValue : 'Varies'}</p>
                            </div>
                            <div className="w-px h-8 bg-white/20"></div>
                            <div className="text-left">
                                <p className="text-[10px] uppercase font-bold text-white/60">Condition</p>
                                <p className="text-sm font-bold">{promo.deviceRequirements?.tradeIn === TradeInRequirement.REQUIRED ? 'Trade-In' : 'Any Cond.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hidden md:flex flex-shrink-0 w-48 h-48 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 items-center justify-center rotate-3 hover:rotate-6 transition-transform duration-500 shadow-inner">
                     <div className="w-24 h-24 text-white drop-shadow-md">
                        {getPromoIcon(promo.category)}
                     </div>
                </div>
            </div>
        </div>
    );
};

const ComparisonModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    promos: Promotion[]; 
    onUsePromo: (id: string) => void; 
}> = ({ isOpen, onClose, promos, onUsePromo }) => {
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl bg-card rounded-3xl overflow-hidden max-h-[90vh]">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
                <h2 className="text-xl font-bold">Compare Promotions</h2>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="flex-1 overflow-x-auto p-6">
                <div className="grid gap-6 min-w-[800px]" style={{ gridTemplateColumns: `repeat(${promos.length}, 1fr)` }}>
                    {promos.map(promo => {
                        const theme = getCategoryTheme(promo.category);
                        return (
                        <div key={promo.id} className="flex flex-col h-full space-y-6">
                            {/* Header */}
                            <div className="text-center space-y-2">
                                <div className={`w-14 h-14 rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center mx-auto`}>
                                    {getPromoIcon(promo.category)}
                                </div>
                                <h3 className="font-bold text-lg leading-tight">{promo.name}</h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${theme.bg} ${theme.text}`}>{promo.category}</span>
                            </div>

                            {/* Main Benefit */}
                            <div className="bg-muted/30 border border-border p-4 rounded-xl text-center">
                                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Value</span>
                                <span className="block text-2xl font-extrabold text-foreground">
                                    ${promo.effects.reduce((acc, e) => acc + (typeof e.value === 'number' ? e.value : 0), 0)}
                                </span>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-4 flex-grow text-sm">
                                <div className="space-y-1">
                                    <p className="font-semibold text-muted-foreground uppercase text-xs">Description</p>
                                    <p className="text-foreground/90 leading-relaxed">{promo.description}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="font-semibold text-muted-foreground uppercase text-xs">Requirements</p>
                                    <ul className="space-y-2">
                                        <li className="flex justify-between items-center bg-muted/30 p-2 rounded-lg">
                                            <span>Trade-In</span>
                                            <span className="font-medium">{promo.deviceRequirements?.tradeIn || 'Optional'}</span>
                                        </li>
                                        <li className="flex justify-between items-center bg-muted/30 p-2 rounded-lg">
                                            <span>New Line</span>
                                            <span className={`font-medium ${promo.deviceRequirements?.newLineRequired ? 'text-blue-600' : ''}`}>{promo.deviceRequirements?.newLineRequired ? 'Required' : 'No'}</span>
                                        </li>
                                        <li className="flex justify-between items-center bg-muted/30 p-2 rounded-lg">
                                            <span>Stacking</span>
                                            <span className="font-medium">{promo.stackingGroup}</span>
                                        </li>
                                    </ul>
                                </div>

                                {promo.bogoConfig && (
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                        <p className="font-bold text-indigo-700 dark:text-indigo-300 text-xs uppercase mb-1">BOGO Deal</p>
                                        <p className="text-xs">Buy {promo.bogoConfig.buyQuantity}, get credit on {promo.bogoConfig.discountTarget.replace('_', ' ')}.</p>
                                    </div>
                                )}
                            </div>

                            {/* Action */}
                            <Button className="w-full mt-auto" onClick={() => onUsePromo(promo.id)}>Apply Quote</Button>
                        </div>
                    )})}
                </div>
            </div>
        </Modal>
    );
};

const PromotionsPage: React.FC = () => {
    const { promotions, handleUsePromo } = useData();
    
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<PromotionCategory | 'All'>('All');
    const [selectedBrand, setSelectedBrand] = useState<string>('All');
    const [showBogoOnly, setShowBogoOnly] = useState(false);
    const [detailPromo, setDetailPromo] = useState<Promotion | null>(null);
    const [compareList, setCompareList] = useState<string[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    // Identify the best "Spotlight" promo for the Hero section
    const featuredPromo = useMemo(() => {
        return promotions.find(p => p.isActive && p.spotlightOnHome);
    }, [promotions]);

    const filteredPromotions = useMemo(() => {
        return promotions.filter(promo => {
            if (!promo.isActive) return false;
            
            const matchSearch = promo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                promo.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = selectedCategory === 'All' || promo.category === selectedCategory;
            const matchBogo = !showBogoOnly || !!promo.bogoConfig;
            
            const matchBrand = selectedBrand === 'All' || 
                (promo.eligibleDeviceTags && promo.eligibleDeviceTags.some(tag => tag.toLowerCase().includes(selectedBrand.toLowerCase()))) ||
                (promo.category !== PromotionCategory.DEVICE && selectedBrand === 'All');

            return matchSearch && matchCategory && matchBogo && matchBrand;
        });
    }, [promotions, searchTerm, selectedCategory, showBogoOnly, selectedBrand]);

    const handleCopyDetails = () => {
        if (!detailPromo) return;
        const text = `
*${detailPromo.name}*
${detailPromo.description}

Requirements:
${detailPromo.deviceRequirements?.tradeIn === TradeInRequirement.REQUIRED ? '- Trade-in Required' : ''}
${detailPromo.deviceRequirements?.newLineRequired ? '- New Line Required' : ''}
        `.trim();
        navigator.clipboard.writeText(text);
    };

    const handleApplyPromo = (id?: string) => {
        const promoId = id || detailPromo?.id;
        if(promoId) {
            handleUsePromo(promoId);
            setDetailPromo(null);
        }
    };

    const toggleCompare = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setCompareList(prev => {
            if (prev.includes(id)) return prev.filter(p => p !== id);
            if (prev.length >= 3) return prev; // Limit to 3
            return [...prev, id];
        });
    };

    const brands = [
        { id: 'All', label: 'All Brands' },
        { id: 'apple', label: 'Apple' },
        { id: 'samsung', label: 'Samsung' },
        { id: 'google', label: 'Google' },
        { id: 'motorola', label: 'Motorola' }
    ];

    return (
        <div className="relative min-h-screen pb-24">
            
            {/* Header Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Promotions Engine</h1>
                    <p className="mt-1 text-base text-muted-foreground">Browse, compare, and apply the latest offers.</p>
                </header>

                {/* Hero Section */}
                {featuredPromo && !searchTerm && selectedCategory === 'All' && selectedBrand === 'All' && !showBogoOnly && (
                    <FeaturedPromo promo={featuredPromo} onApply={() => handleApplyPromo(featuredPromo.id)} />
                )}

                {/* Modern Filter Section */}
                <div className="space-y-6">
                    {/* Top Row: Search & BOGO Toggle & View Mode */}
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input 
                                type="text"
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                                placeholder="Search by name, description, or device..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <div 
                                className={`cursor-pointer select-none rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 transition-all ${showBogoOnly ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-card border-border hover:border-primary/50'}`}
                                onClick={() => setShowBogoOnly(!showBogoOnly)}
                            >
                                <span className={`font-semibold text-sm whitespace-nowrap ${showBogoOnly ? 'text-indigo-700 dark:text-indigo-300' : 'text-foreground'}`}>BOGO Only</span>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${showBogoOnly ? 'bg-indigo-600' : 'bg-input'}`}>
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${showBogoOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-2xl p-1 flex items-center gap-1">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                                    title="Grid View"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                                    title="List View"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Middle Row: Categories (Pills) */}
                    <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${selectedCategory === 'All' ? 'bg-primary text-white border-primary shadow-md' : 'bg-card text-foreground border-border hover:bg-muted'}`}
                            >
                                All Promos
                            </button>
                            {Object.values(PromotionCategory).map(cat => {
                                const theme = getCategoryTheme(cat);
                                const isSelected = selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${isSelected ? 'bg-foreground text-background border-foreground shadow-md' : `bg-card text-muted-foreground border-border hover:text-foreground ${theme.hover}`}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-background' : theme.bg.replace('bg-', 'bg-').replace('/10', '-400')}`}></div>
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Row: Brands (Pills) */}
                    <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                        <div className="flex gap-2 items-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Brand:</span>
                            {brands.map(brand => (
                                <button
                                    key={brand.id}
                                    onClick={() => setSelectedBrand(brand.id)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${selectedBrand === brand.id ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'}`}
                                >
                                    {brand.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Grid/List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {filteredPromotions.length === 0 ? (
                    <div className="text-center py-24 bg-muted/30 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No promotions found</h3>
                        <p className="text-muted-foreground max-w-sm mt-1">Try adjusting your search terms or filters.</p>
                        <Button variant="secondary" className="mt-4" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setShowBogoOnly(false); setSelectedBrand('All'); }}>Clear Filters</Button>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
                        {filteredPromotions.map(promo => (
                            viewMode === 'grid' ? (
                                <PromotionCard 
                                    key={promo.id} 
                                    promo={promo} 
                                    onClick={() => setDetailPromo(promo)} 
                                    onApply={() => handleApplyPromo(promo.id)}
                                    isSelectedForCompare={compareList.includes(promo.id)}
                                    onToggleCompare={(e) => toggleCompare(e, promo.id)}
                                />
                            ) : (
                                <PromotionListItem 
                                    key={promo.id} 
                                    promo={promo} 
                                    onClick={() => setDetailPromo(promo)} 
                                    onApply={() => handleApplyPromo(promo.id)}
                                    isSelectedForCompare={compareList.includes(promo.id)}
                                    onToggleCompare={(e) => toggleCompare(e, promo.id)}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* Comparison Floating Bar */}
            {compareList.length > 0 && (
                <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background pl-6 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-6 animate-fade-in-down ring-1 ring-white/10">
                    <div className="flex items-center gap-3">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        <span className="font-bold text-sm">{compareList.length} Selected</span>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setCompareList([])} className="text-muted-foreground hover:text-foreground hover:bg-white/10">Clear</Button>
                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-full px-6" onClick={() => setIsCompareModalOpen(true)}>Compare Deals</Button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            <Modal isOpen={!!detailPromo} onClose={() => setDetailPromo(null)} className="max-w-xl bg-card rounded-3xl overflow-hidden max-h-[90vh]">
                {detailPromo && (
                    <>
                        <div className={`relative h-48 bg-gradient-to-r ${getCategoryTheme(detailPromo.category).gradient} text-white p-8 flex flex-col justify-end`}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10">
                                        {detailPromo.category}
                                    </span>
                                    {detailPromo.bogoConfig && (
                                        <span className="text-xs font-bold uppercase tracking-wider bg-indigo-500 text-white px-2 py-0.5 rounded-md shadow-sm">
                                            BOGO
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{detailPromo.name}</h2>
                            </div>
                            <button 
                                onClick={() => setDetailPromo(null)}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-base text-foreground leading-relaxed">
                                    {detailPromo.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Conditions</h3>
                                    <ul className="space-y-2">
                                        {(detailPromo.conditions || []).map((cond, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-foreground bg-muted/50 p-2 rounded-lg">
                                                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                                <span>
                                                    <span className="font-semibold">{cond.field}</span> {cond.operator.replace('_', ' ').toLowerCase()} {String(cond.value)}
                                                </span>
                                            </li>
                                        ))}
                                        {(!detailPromo.conditions || detailPromo.conditions.length === 0) && (
                                            <li className="text-sm text-muted-foreground italic">None specified</li>
                                        )}
                                    </ul>
                                </div>

                                {detailPromo.deviceRequirements && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Device Req.</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                                <span className="text-muted-foreground">Trade-In</span>
                                                <span className={`font-semibold ${detailPromo.deviceRequirements.tradeIn === TradeInRequirement.REQUIRED ? 'text-blue-600' : 'text-foreground'}`}>
                                                    {detailPromo.deviceRequirements.tradeIn}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                                <span className="text-muted-foreground">New Line</span>
                                                <span className={`font-semibold ${detailPromo.deviceRequirements.newLineRequired ? 'text-blue-600' : 'text-foreground'}`}>
                                                    {detailPromo.deviceRequirements.newLineRequired ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Benefits</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {detailPromo.effects.map((effect, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            <span className="font-medium text-sm">
                                                {effect.type === PromotionEffectType.DEVICE_CREDIT_FIXED ? `$${effect.value} Credit` : 
                                                 effect.type === PromotionEffectType.DEVICE_INSTANT_REBATE ? `$${effect.value} Instant Rebate` :
                                                 effect.type === PromotionEffectType.PLAN_DISCOUNT_PERCENTAGE ? `${effect.value}% Off Plan` :
                                                 effect.type === PromotionEffectType.PLAN_DISCOUNT_FIXED ? `$${effect.value} Off Plan` :
                                                 `Benefit: ${effect.value}`}
                                                {effect.durationMonths ? ` (over ${effect.durationMonths} mo)` : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-muted/20 flex gap-3 shrink-0">
                            <Button variant="secondary" onClick={handleCopyDetails} className="flex-1">Copy Details</Button>
                            <Button onClick={() => handleApplyPromo()} className="flex-[2] bg-gradient-to-r from-primary to-pink-600 border-0 hover:opacity-90">
                                Use in Quote
                            </Button>
                        </div>
                    </>
                )}
            </Modal>

            <ComparisonModal 
                isOpen={isCompareModalOpen}
                onClose={() => setIsCompareModalOpen(false)}
                promos={promotions.filter(p => compareList.includes(p.id))}
                onUsePromo={(id) => {
                    handleApplyPromo(id);
                    setIsCompareModalOpen(false);
                }}
            />
        </div>
    );
};

export default PromotionsPage;
