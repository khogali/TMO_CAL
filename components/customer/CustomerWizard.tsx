
import React, { useState } from 'react';
import { QuoteConfig, DeviceCategory } from '../../types';

interface CustomerWizardProps {
    config: QuoteConfig;
    setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
    onComplete: (config: QuoteConfig) => void;
}

const CustomerWizard: React.FC<CustomerWizardProps> = ({ config, setConfig, onComplete }) => {
    const [wizardStep, setWizardStep] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleNext = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setWizardStep(prev => prev + 1);
            setIsAnimating(false);
        }, 300);
    };

    const handleLineCountSelect = (count: number) => {
        setConfig(prev => ({ ...prev, lines: count }));
        handleNext();
    };

    const handleDevicePreference = (hasNewDevices: boolean) => {
        if (hasNewDevices) {
            const newDevices = Array.from({ length: config.lines }).map(() => ({
                id: crypto.randomUUID(),
                category: DeviceCategory.PHONE,
                price: 830,
                tradeIn: 0,
                tradeInType: 'manual' as const,
                appliedPromoId: null,
                term: 24,
                downPayment: 0,
                isByod: false,
                modelId: 'generic-phone'
            }));
            setConfig(prev => ({ ...prev, devices: newDevices }));
        } else {
            setConfig(prev => ({ ...prev, devices: [] }));
        }
        onComplete(config);
    };

    // Shared Step Container
    const StepContainer: React.FC<{ children: React.ReactNode; title: string; subtitle: string; stepIndicator: string }> = ({ children, title, subtitle, stepIndicator }) => (
        <div className={`transition-all duration-300 transform ${isAnimating ? 'opacity-0 -translate-x-10' : 'opacity-100 translate-x-0'}`}>
            <div className="text-center mb-10">
                <span className="inline-block py-1 px-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                    {stepIndicator}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">{subtitle}</p>
            </div>
            {children}
        </div>
    );

    // Step 1: Lines
    if (wizardStep === 1) {
        return (
            <StepContainer 
                title="How many lines?" 
                subtitle="Select the number of phone lines you need for your plan."
                stepIndicator="Step 1 of 2"
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                        <button
                            key={num}
                            onClick={() => handleLineCountSelect(num)}
                            className="group relative h-32 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm hover:border-pink-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden"
                        >
                            <span className="text-4xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-pink-600 transition-colors">
                                {num}{num === 6 ? '+' : ''}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-pink-500">Lines</span>
                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    ))}
                </div>
            </StepContainer>
        );
    }

    // Step 2: Devices
    return (
        <StepContainer 
            title="Need new phones?" 
            subtitle="Are you bringing your own devices or looking to upgrade to the latest models?"
            stepIndicator="Step 2 of 2"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button
                    onClick={() => handleDevicePreference(false)}
                    className="group relative p-8 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-left shadow-sm hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                        📲
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">Bring my own</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        I'll keep my current phones and just switch my service to T-Mobile.
                    </p>
                </button>

                <button
                    onClick={() => handleDevicePreference(true)}
                    className="group relative p-8 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-left shadow-sm hover:border-pink-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                    <div className="w-16 h-16 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">
                        ✨
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-pink-600 transition-colors">Get new phones</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        I want to trade-in my old devices or buy new ones with my plan.
                    </p>
                </button>
            </div>
            
            <div className="mt-12 text-center">
                <button onClick={() => setWizardStep(1)} className="text-sm font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-2 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to previous step
                </button>
            </div>
        </StepContainer>
    );
};

export default CustomerWizard;
