import React, { useState, useMemo } from 'react';
import { QuoteConfig, CustomerType, Promotion, PromotionCategory } from '../../types';
import { useData } from '../../context/AppContext';
import Section from '../ui/Section';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Toggle from '../ui/Toggle';
import Button from '../ui/Button';
import { analyzePromotion } from '../../utils/conditionUtils';
import Modal from '../ui/Modal';
import { applyPromoToConfig } from '../../utils/promoUtils';

// --- Local Helpers matching PromotionsSpotlight style ---

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

interface PromoListItemProps {
    promo: Promotion;
    status: 'eligible' | 'locked';
    failureReasons: string[];
    onClick: () => void;
}

const PromoListItem: React.FC<PromoListItemProps> = ({ promo, status, failureReasons, onClick }) => {
    const isLocked = status === 'locked';
    
    const getTheme = (id: string) => {
        if (isLocked) {
            return { iconBg: 'bg-muted dark:bg-muted/50', iconText: 'text-muted-foreground' };
        }
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
            type="button"
            onClick={onClick}
            className={`w-full flex items-center p-3 rounded-xl border shadow-sm transition-all duration-200 text-left group
                ${isLocked 
                    ? 'bg-muted/10 border-dashed border-border hover:bg-muted/20 opacity-90' 
                    : 'bg-background/50 border-border/50 hover:shadow-md hover:bg-background'
                }`}
        >
            <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${theme.iconBg} ${theme.iconText} mr-3 transition-transform group-hover:scale-105 relative`}>
                <div className="w-5 h-5">
                    {getPromoIcon(promo.category)}
                </div>
                {isLocked && (
                    <div className="absolute -top-1 -right-1 bg-card rounded-full p-0.5 shadow-sm border border-border">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`text-sm font-bold truncate leading-tight ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {promo.name}
                    </h3>
                </div>
                {isLocked && failureReasons.length > 0 ? (
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 truncate flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                        {failureReasons[0]}
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground truncate pr-2">
                        {promo.description}
                    </p>
                )}
            </div>
            <div className="text-muted-foreground/50 group-hover:text-primary transition-colors pl-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
};

// --- Main Component ---

interface PlanDetailsSectionProps {
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
}

const PlanDetailsSection: React.FC<PlanDetailsSectionProps> = ({ config, setConfig }) => {
  const { planPricing, promotions, deviceDatabase, servicePlans } = useData();
  const planDetails = planPricing.find(p => p.id === config.plan);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);

  const displayedPromotions = useMemo(() => {
    return promotions
        .map(promo => {
            const analysis = analyzePromotion(config, promo);
            return { promo, ...analysis };
        })
        .filter(item => item.status !== 'hidden')
        .sort((a, b) => {
            if (a.status === b.status) return 0;
            return a.status === 'eligible' ? -1 : 1; // Eligible first
        });
  }, [config, promotions]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setConfig(prev => ({ ...prev, [parent]: { ...((prev[parent as keyof QuoteConfig] as object) || {}), [child]: type === 'checkbox' ? checked : value } }));
    } else {
        setConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value) }));
    }
  };

  const handleValueChange = (name: string, value: string | CustomerType) => {
    if (name === 'plan') {
       setConfig(prev => prev.plan !== value ? { ...prev, plan: value as string, lines: 1 } : prev);
    } else {
       setConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLinesChange = (increment: number) => {
    if (!planDetails) return;
    const minLines = 1;
    const maxLines = planDetails.maxLines || 8;
    setConfig(prev => {
      const newLines = prev.lines + increment;
      if (newLines >= minLines && newLines <= maxLines) {
        return { ...prev, lines: newLines };
      }
      return prev;
    });
  };

  const handleApplyPromoSettings = () => {
      if (selectedPromo) {
          setConfig(prev => applyPromoToConfig(prev, selectedPromo, deviceDatabase, servicePlans));
          setSelectedPromo(null);
      }
  };

  const availablePlans = planPricing.filter(plan => plan.availableFor.includes(config.customerType)).map(plan => ({ value: plan.id, label: plan.name }));

  return (
    <Section title="Plan Details" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <Select label="Plan Type" name="plan" value={config.plan} onChange={handleValueChange} options={availablePlans} />
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Number of Lines</label>
          <div className="flex items-center justify-between w-full h-12 rounded-xl bg-muted px-2">
            <button type="button" onClick={() => handleLinesChange(-1)} disabled={config.lines <= 1} className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-border disabled:opacity-50" aria-label="Decrease lines"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg></button>
            <div className="text-center font-bold text-lg text-foreground w-12">{config.lines}</div>
            <button type="button" onClick={() => handleLinesChange(1)} disabled={config.lines >= (planDetails?.maxLines || 8)} className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-border disabled:opacity-50" aria-label="Increase lines"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg></button>
          </div>
        </div>
      </div>

       {displayedPromotions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border/50">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Promotion Highlights</h4>
          <div className="flex flex-col gap-2">
            {displayedPromotions.map(({ promo, status, reasons }) => (
              <PromoListItem 
                key={promo.id} 
                promo={promo} 
                status={status} 
                failureReasons={reasons} 
                onClick={() => setSelectedPromo(promo)} 
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-border">
          <div className="space-y-4"><Toggle label="Activation Fee" description="$10 per line, one-time fee" name="fees.activation" checked={config.fees?.activation || false} onChange={handleInputChange} /></div>
          <hr className="my-6 border-border border-dashed" />
          <Input label="Tax Rate" type="number" name="taxRate" value={config.taxRate} onChange={handleInputChange} suffix="%" step="0.1" />
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
                        type="button"
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
                    <Button variant="secondary" onClick={() => setSelectedPromo(null)} className="w-full">Close</Button>
                    <Button onClick={handleApplyPromoSettings} className="w-full bg-primary/90 hover:bg-primary text-white">Apply Settings</Button>
                </div>
            </>
        )}
      </Modal>
    </Section>
  );
};

export default PlanDetailsSection;
