
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/AppContext';
import { calculateQuoteTotals } from '../utils/calculations';
import { createInitialConfig } from '../constants';
import { QuoteConfig, DeviceCategory, PlanDetails, CustomerType, Device, AccessoryPaymentType } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';

// --- Types ---
export interface QuoteWizardProps {
    initialConfig?: QuoteConfig;
    onConfigChange: (config: QuoteConfig) => void;
    isEmbedded?: boolean;
}

// --- Icons ---
const Icons = {
    User: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Plan: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Device: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
};

// --- Helper Components ---

const WizardStepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => (
    <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, idx) => (
            <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx + 1 === currentStep ? 'w-8 bg-primary' : idx + 1 < currentStep ? 'w-2 bg-primary/50' : 'w-2 bg-muted'}`}
            />
        ))}
    </div>
);

const SelectionCard: React.FC<{ 
    selected: boolean; 
    onClick: () => void; 
    title: string; 
    subtitle?: string; 
    icon?: React.ReactNode;
    price?: string;
}> = ({ selected, onClick, title, subtitle, icon, price }) => (
    <button 
        onClick={onClick}
        className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden group
            ${selected 
                ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
            }`}
    >
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                {icon && (
                    <div className={`p-3 rounded-xl transition-colors ${selected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-white group-hover:text-primary'}`}>
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className={`font-bold text-lg ${selected ? 'text-primary' : 'text-foreground'}`}>{title}</h3>
                    {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>
            </div>
            {price && (
                <div className="text-right">
                    <span className="block font-bold text-lg text-foreground">{price}</span>
                </div>
            )}
        </div>
        {selected && (
            <div className="absolute top-2 right-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
        )}
    </button>
);

// --- Main Wizard Component ---

export const QuoteWizard: React.FC<QuoteWizardProps> = ({ initialConfig, onConfigChange }) => {
    const { planPricing, deviceDatabase, servicePlans, discountSettings, insurancePlans, promotions } = useData();
    
    // --- Wizard State ---
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState<QuoteConfig>(() => initialConfig || createInitialConfig(planPricing));
    
    // --- Derived Totals for Real-time Pricing ---
    const totals = useMemo(() => 
        calculateQuoteTotals(config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase), 
        [config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase]
    );

    // --- Actions ---
    
    const updateConfig = (updates: Partial<QuoteConfig>) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        // We don't call onConfigChange immediately to allow the user to finish the wizard flow first, 
        // OR we can call it if the parent just wants updates. 
        // For the "Launch" flow, we usually wait until "Finish".
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleFinish = () => {
        onConfigChange(config);
    };

    // --- Step 1: Lines & Type ---
    if (step === 1) {
        return (
            <div className="max-w-2xl mx-auto p-6 h-full flex flex-col">
                <WizardStepIndicator currentStep={1} totalSteps={4} />
                
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-foreground mb-2">Let's get started</h2>
                    <p className="text-muted-foreground">Who are we building this quote for?</p>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto pb-20">
                    {/* Customer Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[CustomerType.STANDARD, CustomerType.MILITARY_FR, CustomerType.PLUS_55].map(type => (
                            <button
                                key={type}
                                onClick={() => updateConfig({ customerType: type })}
                                className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${config.customerType === type ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card hover:border-primary/30'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Line Count */}
                    <div>
                        <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 text-center">How many voice lines?</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {[1, 2, 3, 4, 5, 6].map(num => (
                                <button
                                    key={num}
                                    onClick={() => updateConfig({ lines: num })}
                                    className={`h-16 rounded-2xl font-black text-2xl transition-all border-2 ${config.lines === num ? 'border-primary bg-primary text-white shadow-lg scale-110' : 'border-border bg-card hover:border-primary/50'}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-border">
                    <Button onClick={handleNext} className="w-full h-14 text-lg shadow-lg">Continue</Button>
                </div>
            </div>
        );
    }

    // --- Step 2: Plan Selection ---
    if (step === 2) {
        const eligiblePlans = planPricing.filter(p => p.availableFor.includes(config.customerType));
        
        return (
            <div className="max-w-2xl mx-auto p-6 h-full flex flex-col">
                <WizardStepIndicator currentStep={2} totalSteps={4} />
                
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-foreground mb-2">Choose a Plan</h2>
                    <p className="text-muted-foreground">Best options for {config.lines} line{config.lines > 1 ? 's' : ''}</p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pb-20">
                    {eligiblePlans.map(plan => {
                        // Calculate price for this plan
                        const tempConfig = { ...config, plan: plan.id };
                        const tempTotals = calculateQuoteTotals(tempConfig, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase);
                        const price = tempTotals ? tempTotals.finalPlanPriceInCents / 100 : 0;

                        return (
                            <SelectionCard
                                key={plan.id}
                                title={plan.name}
                                subtitle={plan.features?.[0]}
                                price={`$${price.toFixed(0)}/mo`}
                                icon={<Icons.Plan />}
                                selected={config.plan === plan.id}
                                onClick={() => updateConfig({ plan: plan.id })}
                            />
                        );
                    })}
                </div>

                <div className="mt-auto pt-6 border-t border-border flex gap-4">
                    <Button variant="ghost" onClick={handleBack} className="w-1/3 h-14">Back</Button>
                    <Button onClick={handleNext} className="w-2/3 h-14 shadow-lg">Continue</Button>
                </div>
            </div>
        );
    }

    // --- Step 3: Devices ---
    if (step === 3) {
        const handleAddDevices = (type: 'new' | 'byod') => {
            if (type === 'byod') {
                updateConfig({ devices: [] }); // Clear devices implies BYOD in this simple wizard
            } else {
                // Pre-populate placeholders
                const newDevices = Array.from({ length: config.lines }).map(() => ({
                    id: crypto.randomUUID(),
                    category: DeviceCategory.PHONE,
                    price: 830, // Placeholder price
                    tradeIn: 0,
                    tradeInType: 'manual' as const,
                    appliedPromoId: null,
                    term: 24,
                    downPayment: 0,
                    isByod: false,
                    modelId: '', // User will select in Editor
                }));
                updateConfig({ devices: newDevices });
            }
            handleNext();
        };

        return (
            <div className="max-w-2xl mx-auto p-6 h-full flex flex-col">
                <WizardStepIndicator currentStep={3} totalSteps={4} />
                
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-foreground mb-2">Need phones?</h2>
                    <p className="text-muted-foreground">Are you bringing phones or buying new ones?</p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pb-20 flex flex-col justify-center">
                    <SelectionCard
                        title="Get New Phones"
                        subtitle="I want to finance new devices or trade-in."
                        icon={<Icons.Device />}
                        selected={config.devices.length > 0}
                        onClick={() => handleAddDevices('new')}
                    />
                    <SelectionCard
                        title="Bring Your Own"
                        subtitle="I have compatible unlocked phones."
                        icon={<Icons.User />} // Using User icon as placeholder for BYOD person
                        selected={config.devices.length === 0}
                        onClick={() => handleAddDevices('byod')}
                    />
                </div>

                <div className="mt-auto pt-6 border-t border-border flex gap-4">
                    <Button variant="ghost" onClick={handleBack} className="w-1/3 h-14">Back</Button>
                    {/* Next is handled by selection for smoother flow, but keep button just in case */}
                </div>
            </div>
        );
    }

    // --- Step 4: Summary & Finish ---
    return (
        <div className="max-w-2xl mx-auto p-6 h-full flex flex-col">
            <WizardStepIndicator currentStep={4} totalSteps={4} />
            
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-foreground mb-2">Ready to Build</h2>
                <p className="text-muted-foreground">Here's your starting point.</p>
            </div>

            <div className="flex-1 overflow-y-auto pb-8">
                <div className="bg-card border-2 border-primary/20 rounded-3xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-purple-600"></div>
                    
                    <div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Estimated Monthly</p>
                        <p className="text-6xl font-black text-foreground tracking-tighter">
                            ${(totals?.totalMonthlyInCents || 0) / 100}
                        </p>
                    </div>

                    <div className="space-y-2 text-left bg-muted/30 p-4 rounded-xl">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Lines</span>
                            <span className="font-bold">{config.lines}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Plan</span>
                            <span className="font-bold">{totals?.planName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Devices</span>
                            <span className="font-bold">{config.devices.length > 0 ? 'New Devices' : 'BYOD'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-6 border-t border-border flex gap-4">
                <Button variant="ghost" onClick={handleBack} className="w-1/3 h-14">Back</Button>
                <Button onClick={handleFinish} className="w-2/3 h-14 shadow-lg bg-primary hover:bg-primary/90 text-white font-bold text-lg">
                    Open Editor
                </Button>
            </div>
        </div>
    );
};
