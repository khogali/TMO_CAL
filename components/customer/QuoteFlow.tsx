
import React, { useState } from 'react';
import { QuoteConfig, DeviceCategory } from '../../types';
import { useData } from '../../context/AppContext';
import { createInitialConfig } from '../../constants';

interface QuoteFlowProps {
    initialConfig?: QuoteConfig;
    onComplete: (config: QuoteConfig) => void;
    onCancel: () => void;
}

const QuoteFlow: React.FC<QuoteFlowProps> = ({ initialConfig, onComplete }) => {
    const { planPricing, deviceDatabase } = useData();
    const [config, setConfig] = useState<QuoteConfig>(() => initialConfig || createInitialConfig(planPricing));
    
    // UI State for the "Card" inputs
    const [devicePref, setDevicePref] = useState<'new' | 'byod' | ''>('new');
    const [selectedPhoneId, setSelectedPhoneId] = useState('');
    const [tradeInStatus, setTradeInStatus] = useState<'yes' | 'no' | ''>('');
    const [carrier, setCarrier] = useState('');
    
    // Helper to get phone options
    const phoneOptions = deviceDatabase.devices
        .filter(d => d.category === DeviceCategory.PHONE)
        .map(d => ({ value: d.id, label: d.name }));

    const handleSearch = () => {
        // Construct the final config based on the "Search Card" inputs
        const newConfig = { ...config };
        
        // 1. Devices
        if (devicePref === 'new' && selectedPhoneId) {
            newConfig.devices = Array.from({ length: config.lines }).map(() => ({
                id: crypto.randomUUID(),
                category: DeviceCategory.PHONE,
                price: 830, // Estimating based on standard flagship
                tradeIn: tradeInStatus === 'yes' ? 200 : 0,
                tradeInType: tradeInStatus === 'yes' ? 'manual' : 'manual',
                appliedPromoId: null,
                term: 24,
                downPayment: 0,
                isByod: false,
                modelId: selectedPhoneId
            }));
        } else if (devicePref === 'byod') {
            newConfig.devices = []; // Empty implies BYOD in our logic
        }

        onComplete(newConfig);
    };

    return (
        <div className="w-full bg-card rounded-3xl border border-border shadow-soft-lg overflow-hidden animate-fade-in-down">
            
            {/* Header Tabs */}
            <div className="flex border-b border-border bg-muted/20">
                <button className="flex-1 px-6 py-5 text-sm font-bold text-primary border-b-2 border-primary bg-background">
                    Build Your Quote
                </button>
                <button className="flex-1 px-6 py-5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors hover:bg-background/50">
                    Check Coverage
                </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
                {/* Row 1: Phone Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-foreground uppercase tracking-wider">Desired Phone</label>
                    <div className="relative">
                        <select 
                            className="w-full h-14 pl-5 pr-10 rounded-2xl border border-border bg-background text-foreground appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base shadow-sm"
                            value={devicePref === 'byod' ? 'byod' : selectedPhoneId}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'byod') {
                                    setDevicePref('byod');
                                    setSelectedPhoneId('');
                                } else {
                                    setDevicePref('new');
                                    setSelectedPhoneId(val);
                                }
                            }}
                        >
                            <option value="" disabled>Select a phone...</option>
                            <option value="byod">Bring My Own Phone (BYOD)</option>
                            <optgroup label="Popular Phones">
                                {phoneOptions.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </optgroup>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Row 2: Trade-In */}
                    <div className={`space-y-3 transition-opacity ${devicePref === 'byod' ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="block text-sm font-bold text-foreground uppercase tracking-wider">Trading in?</label>
                        <div className="relative">
                            <select 
                                className="w-full h-14 pl-5 pr-10 rounded-2xl border border-border bg-background text-foreground appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base shadow-sm"
                                value={tradeInStatus}
                                onChange={(e) => setTradeInStatus(e.target.value as any)}
                            >
                                <option value="" disabled>Select...</option>
                                <option value="yes">Yes, I have a trade-in</option>
                                <option value="no">No trade-in</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Carrier */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-foreground uppercase tracking-wider">Current Provider</label>
                        <div className="relative">
                            <select 
                                className="w-full h-14 pl-5 pr-10 rounded-2xl border border-border bg-background text-foreground appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base shadow-sm"
                                value={carrier}
                                onChange={(e) => setCarrier(e.target.value)}
                            >
                                <option value="" disabled>Select...</option>
                                <option value="verizon">Verizon</option>
                                <option value="att">AT&T</option>
                                <option value="tmobile">T-Mobile (Existing)</option>
                                <option value="other">Other</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Row 3: Lines */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-foreground uppercase tracking-wider">Lines Needed</label>
                        <div className="relative">
                            <select 
                                className="w-full h-14 pl-5 pr-10 rounded-2xl border border-border bg-background text-foreground appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base shadow-sm"
                                value={config.lines}
                                onChange={(e) => setConfig({ ...config, lines: Number(e.target.value) })}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                    <option key={n} value={n}>{n} Line{n > 1 ? 's' : ''}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Zip */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-foreground uppercase tracking-wider">Zip Code</label>
                        <input 
                            type="text" 
                            placeholder="Enter 5-digit zip"
                            className="w-full h-14 pl-5 rounded-2xl border border-border bg-background text-foreground appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base shadow-sm placeholder:text-muted-foreground"
                        />
                    </div>
                </div>

                {/* Search Action */}
                <div className="pt-6">
                    <button 
                        onClick={handleSearch}
                        className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transform hover:-translate-y-0.5"
                    >
                        See My Deals
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                    <p className="text-center text-xs text-muted-foreground mt-4">
                        By clicking "See My Deals", you agree to our Terms of Use and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuoteFlow;
