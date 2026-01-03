
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
        <div className={`relative rounded-3xl p-6 border-2 transition-all duration-300 ${isRecommended ? 'border-pink-600 bg-white dark:bg-slate-800 shadow-xl scale-105 z-10' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 grayscale-[0.5] hover:grayscale-0'}`}>
            {isRecommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    Best Value
                </div>
            )}
            
            <div className="text-center mb-4">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                        ${(totals.totalMonthlyInCents / 100).toFixed(0)}
                    </span>
                    <span className="text-gray-500 text-sm font-medium">/mo</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">with AutoPay</p>
            </div>

            <ul className="space-y-3 mb-6">
                {(plan.features || []).slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <Button 
                onClick={onSelect}
                className={`w-full rounded-xl h-12 font-bold ${isRecommended ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
                Select Plan
            </Button>
        </div>
    );
};

const CustomerResults: React.FC<CustomerResultsProps> = ({ config, onBack }) => {
    const { planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase } = useData();
    const [showPaywall, setShowPaywall] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [selectedPlanName, setSelectedPlanName] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // We want to show a comparison of the top plans
    // We'll calculate totals for the user's config against 3 distinct plans (e.g. Essentials, More, Beyond)
    // assuming they exist in the planPricing data.
    
    const comparisonResults = useMemo(() => {
        const targetPlanIds = ['essentials', 'experience-more', 'experience-beyond'];
        
        return targetPlanIds.map(planId => {
            const plan = planPricing.find(p => p.id === planId);
            if (!plan) return null;

            // Create a temp config for calculation
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
        // In a real app, this would submit the lead to the backend
        setSubmitted(true);
        setTimeout(() => {
            // Optional: Reset or redirect
        }, 3000);
    };

    return (
        <div className="space-y-8 animate-fade-in-down">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Edit
                </button>
                <h2 className="text-lg font-bold">Your Estimate</h2>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            <div className="space-y-6">
                {comparisonResults.map((result, idx) => (
                    <PlanResultCard 
                        key={result.plan.id} 
                        plan={result.plan} 
                        totals={result.totals} 
                        isRecommended={idx === 1} // Recommend the middle option usually
                        onSelect={() => handleSelectPlan(result.plan.name)}
                    />
                ))}
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white text-center shadow-lg mt-8">
                <h3 className="font-bold text-xl mb-2">Want to save even more?</h3>
                <p className="text-indigo-100 mb-4 text-sm">Unlock detailed breakdown, hidden discounts, and expert assistance.</p>
                <Button 
                    onClick={() => setShowPaywall(true)}
                    className="bg-white text-indigo-600 hover:bg-indigo-50 w-full font-bold h-12 rounded-xl border-none"
                >
                    Unlock Full Report
                </Button>
            </div>

            {/* Simple Paywall Modal Simulation */}
            {showPaywall && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-down">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-purple-600"></div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unlock Pro Mode</h3>
                        <p className="text-gray-500 dark:text-gray-300 mb-6">Get a verified quote with maximum savings applied by a certified expert.</p>
                        
                        <div className="space-y-3">
                            <Button className="w-full bg-black text-white hover:bg-gray-800 h-12 rounded-xl">
                                 Pay with Apple Pay
                            </Button>
                            <Button variant="secondary" onClick={() => setShowPaywall(false)} className="w-full">
                                Maybe Later
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Form Modal */}
            {showContactForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-down">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-pink-600"></div>
                        
                        {!submitted ? (
                            <>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Save Your Quote</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-300 mb-6">
                                    Send this <strong>{selectedPlanName}</strong> estimate to a local T-Mobile Expert to verify availability and lock in these prices.
                                </p>
                                
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <div className="space-y-1 text-left">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                                        <input required type="text" className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-pink-500 focus:outline-none dark:bg-slate-700 dark:border-slate-600" placeholder="Your Name" />
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                                        <input required type="tel" className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-pink-500 focus:outline-none dark:bg-slate-700 dark:border-slate-600" placeholder="(555) 123-4567" />
                                    </div>
                                    <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-pink-600 hover:bg-pink-700 text-white mt-2">
                                        Connect with Expert
                                    </Button>
                                    <button type="button" onClick={() => setShowContactForm(false)} className="text-sm text-gray-400 hover:text-gray-600 mt-4 block w-full">
                                        Cancel
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="py-8">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    ✓
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request Sent!</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-300 mb-6">
                                    A T-Mobile Expert will reach out to you shortly to finalize your <strong>{selectedPlanName}</strong> quote.
                                </p>
                                <Button onClick={() => { setShowContactForm(false); setSubmitted(false); }} className="w-full h-12 rounded-xl">
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

export default CustomerResults;
