
import React, { useMemo, useState } from 'react';
import { QuoteConfig, PlanDetails, CalculatedTotals } from '../../types';
import { useData } from '../../context/AppContext';
import { calculateQuoteTotals } from '../../utils/calculations';
import Button from '../ui/Button';

interface CustomerResultsProps {
    config: QuoteConfig;
    onBack: () => void;
}

const PlanResultCard: React.FC<{
    plan: PlanDetails;
    totals: CalculatedTotals | null;
    isRecommended?: boolean;
    onSelect: () => void;
}> = ({ plan, totals, isRecommended, onSelect }) => {
    if (!totals) return null;

    return (
        <div className={`relative rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col h-full ${isRecommended ? 'border-primary bg-background shadow-soft-lg scale-[1.02] z-10 ring-4 ring-primary/5' : 'border-border bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-md'}`}>
            {isRecommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    Best Value
                </div>
            )}
            
            <div className="text-center mb-6 pt-2">
                <h3 className="font-bold text-xl text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-5xl font-extrabold text-foreground tracking-tight">
                        ${(totals.totalMonthlyInCents / 100).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground text-base font-medium">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium bg-muted/50 inline-block px-2 py-1 rounded-md">with AutoPay</p>
            </div>

            <div className="flex-grow space-y-4 mb-8">
                <div className="h-px bg-border w-full"></div>
                <ul className="space-y-3">
                    {(plan.features || []).slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                            <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="leading-snug">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <Button 
                onClick={onSelect}
                className={`w-full rounded-xl h-14 font-bold text-lg shadow-sm transition-all ${isRecommended ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/20' : 'bg-white dark:bg-slate-700 border border-border text-foreground hover:bg-muted'}`}
            >
                Select Plan
            </Button>
        </div>
    );
};

const QuoteSummary: React.FC<CustomerResultsProps> = ({ config, onEdit, onStartNew }) => {
    const { planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase } = useData();
    const [showPaywall, setShowPaywall] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [selectedPlanName, setSelectedPlanName] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const comparisonResults = useMemo(() => {
        const targetPlanIds = ['essentials', 'experience-more', 'experience-beyond'];
        
        return targetPlanIds.map(planId => {
            const plan = planPricing.find(p => p.id === planId);
            if (!plan) return null;

            const tempConfig = { ...config, plan: planId };
            const totals = calculateQuoteTotals(
                tempConfig,
                planPricing,
                servicePlans,
                discountSettings,
                insurancePlans,
                promotions,
                deviceDatabase
            );
            return { plan, totals };
        }).filter(r => r !== null) as { plan: PlanDetails, totals: CalculatedTotals }[];
    }, [config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase]);

    const handleSelectPlan = (planName: string) => {
        setSelectedPlanName(planName);
        setShowContactForm(true);
    };

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="space-y-8 animate-fade-in-down">
            <div className="flex justify-between items-center bg-card rounded-2xl p-4 border border-border shadow-sm">
                <button onClick={onEdit} className="flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors gap-2 px-2 py-1 rounded-lg hover:bg-muted">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Modify Config
                </button>
                <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estimate For</p>
                    <p className="text-sm font-bold text-foreground">{config.lines} Line{config.lines > 1 ? 's' : ''} • {config.devices.length > 0 ? 'New Phones' : 'BYOD'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {comparisonResults.map((result, idx) => (
                    <PlanResultCard 
                        key={result.plan.id} 
                        plan={result.plan} 
                        totals={result.totals} 
                        isRecommended={idx === 1} 
                        onSelect={() => handleSelectPlan(result.plan.name)}
                    />
                ))}
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10">
                    <h3 className="font-bold text-2xl mb-2">Want to maximize your savings?</h3>
                    <p className="text-indigo-100 mb-6 text-base max-w-xl mx-auto">Get a verified quote from a certified expert who can apply hidden discounts and check local inventory.</p>
                    <Button 
                        onClick={() => setShowPaywall(true)}
                        className="bg-white text-indigo-600 hover:bg-indigo-50 w-full sm:w-auto px-8 font-bold h-14 rounded-2xl border-none text-lg shadow-lg"
                    >
                        Unlock Full Report
                    </Button>
                </div>
            </div>

            {/* Paywall Modal */}
            {showPaywall && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-down">
                    <div className="bg-card rounded-[2rem] p-8 max-w-sm w-full text-center relative overflow-hidden border border-border shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-purple-600"></div>
                        <h3 className="text-2xl font-bold text-foreground mb-2 mt-2">Unlock Pro Mode</h3>
                        <p className="text-muted-foreground mb-8 text-sm">Access detailed breakdowns, fee waivers, and expert assistance.</p>
                        
                        <div className="space-y-3">
                            <Button className="w-full bg-foreground text-background hover:bg-foreground/90 h-14 rounded-2xl font-bold text-base shadow-md">
                                 Pay with Apple Pay
                            </Button>
                            <Button variant="ghost" onClick={() => setShowPaywall(false)} className="w-full text-muted-foreground hover:text-foreground">
                                No thanks, maybe later
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Form Modal */}
            {showContactForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-down">
                    <div className="bg-card rounded-[2rem] p-8 max-w-sm w-full text-center relative overflow-hidden border border-border shadow-2xl">
                        {!submitted ? (
                            <>
                                <h3 className="text-xl font-bold text-foreground mb-2 mt-2">Save Your Quote</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Send this <strong>{selectedPlanName}</strong> estimate to a local Expert to verify eligibility.
                                </p>
                                
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <input required type="text" className="w-full rounded-xl border border-input bg-background p-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Your Name" />
                                    <input required type="tel" className="w-full rounded-xl border border-input bg-background p-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="(555) 123-4567" />
                                    
                                    <Button type="submit" className="w-full h-14 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white mt-2 shadow-lg shadow-primary/20">
                                        Connect with Expert
                                    </Button>
                                    <button type="button" onClick={() => setShowContactForm(false)} className="text-sm text-muted-foreground hover:text-foreground mt-4 block w-full font-medium">
                                        Cancel
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="py-8">
                                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-green-500/20">
                                    ✓
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-2">Request Sent!</h3>
                                <p className="text-sm text-muted-foreground mb-8">
                                    A T-Mobile Expert will reach out to you shortly to finalize your <strong>{selectedPlanName}</strong> quote.
                                </p>
                                <Button onClick={() => { setShowContactForm(false); setSubmitted(false); }} className="w-full h-14 rounded-xl font-bold">
                                    Close
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteSummary;
