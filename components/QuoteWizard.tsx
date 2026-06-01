
import React, { useState, useMemo, useEffect } from 'react';
import { useData, useUI, useAuth } from '../context/AppContext';
import { createInitialConfig } from '../constants';
import { calculateQuoteTotals } from '../utils/calculations';
import { QuoteConfig, CustomerType, DeviceCategory, Device, PromotionCategory, PromotionEffectType } from '../types';
import Button from './ui/Button';
import MobileAppShell from './ui/MobileAppShell';
import { checkCondition } from '../utils/conditionUtils';

// --- CUSTOM ICONS ---

const Icons = {
    Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    Signal: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 20V4"/></svg>,
    CreditCard: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    Gift: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
    Phone: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    X: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
    ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
    Apple: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>,
    Android: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="2" x2="9" y2="7"/><line x1="15" y1="2" x2="15" y2="7"/><path d="M21 12H3"/><path d="M2 15h20"/><path d="M6 19h12"/><rect x="6" y="7" width="12" height="12" rx="3"/></svg>,
    Recycle: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 9.5a1.83 1.83 0 0 1-1.582-.881 1.785 1.785 0 0 1 .004-1.784l4.296-7.382a1.83 1.83 0 0 1 1.568-.881 1.785 1.785 0 0 1 1.57.881l1.69 2.904a1.83 1.83 0 0 1-.002 1.784l-1.226 2.12"/></svg>,
    Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>,
};

// --- SUB-COMPONENTS ---

const WizardHeader: React.FC<{ step: number; totalSteps: number; onExit: () => void }> = ({ step, totalSteps, onExit }) => {
    const getTitle = () => {
        switch(step) {
            case 1: return 'Choose Plan';
            case 2: return 'Line Count';
            case 3: return 'Device Setup';
            case 4: return 'Review';
            default: return 'Wizard';
        }
    };

    return (
        <div className="pt-safe-top sticky top-0 z-50 bg-background/95 backdrop-blur-md">
            {/* Segmented Progress Bar */}
            <div className="flex gap-1.5 px-4 py-3">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < step ? 'bg-primary' : 'bg-muted'}`}
                    />
                ))}
            </div>
            
            {/* Title Row */}
            <div className="flex items-center justify-between px-4 pb-2 h-10">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-fade-in-down">
                    {getTitle()}
                </span>
                <button 
                    onClick={onExit} 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Icons.X />
                </button>
            </div>
        </div>
    );
};

// Updated Card to match Step 1 Screenshot (Standard Design Language)
interface WizardOptionCardProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onClick: () => void;
    selected: boolean;
    badge?: string;
    price?: string;
    benefits?: string[];
}

const WizardOptionCard: React.FC<WizardOptionCardProps> = ({ 
    title, subtitle, icon, onClick, selected, badge, price, benefits 
}) => {
    return (
        <button
            onClick={onClick}
            className={`
                w-full rounded-2xl p-4 text-left transition-all duration-200 border-2 relative overflow-hidden group
                ${selected 
                    ? 'bg-card border-primary shadow-md' 
                    : 'bg-card border-border hover:border-primary/30'
                }
            `}
        >
            <div className="flex items-center justify-between gap-4">
                {/* Left: Icon & Title */}
                <div className="flex items-center gap-4 flex-1">
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0
                        ${selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                    `}>
                        {icon}
                    </div>
                    <div>
                        <h3 className={`font-bold text-base ${selected ? 'text-foreground' : 'text-foreground/80'}`}>
                            {title}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {/* Right: Radio */}
                <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0
                    ${selected 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground/30 bg-transparent'
                    }
                `}>
                    {selected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
            </div>

            {/* Selected Content (Price & Features) */}
            <div className={`
                transition-[max-height,opacity,margin] duration-300 ease-in-out overflow-hidden
                ${selected ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
            `}>
                <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-foreground">{price}</span>
                        {badge && <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider">{badge}</span>}
                    </div>
                    
                    {benefits && (
                        <div className="space-y-2">
                            {benefits.slice(0, 3).map((b, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    <span className="leading-tight">{b}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
};

const StepHeading: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="mb-5 px-1 animate-fade-in-down">
        <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-sm">{subtitle}</p>
    </div>
);

// --- MAIN WIZARD ---

const QuoteWizard: React.FC = () => {
    const { setView, setToastMessage } = useUI();
    const { user } = useAuth();
    const { 
        planPricing, 
        servicePlans, 
        discountSettings, 
        insurancePlans, 
        promotions, 
        deviceDatabase,
        handleSaveOrUpdateLead,
        setSessionQuote,
    } = useData();
    
    // State
    const [step, setStep] = useState(1);
    const [activeTypeTab, setActiveTypeTab] = useState<CustomerType>(CustomerType.STANDARD);
    const [customerType, setCustomerType] = useState<CustomerType>(CustomerType.STANDARD);
    const [lines, setLines] = useState(1);
    
    // New Device State
    const [deviceMode, setDeviceMode] = useState<'byod' | 'new' | 'mixed'>('new');
    const [newPhoneCount, setNewPhoneCount] = useState(1);
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [deviceSearch, setDeviceSearch] = useState('');
    const [brandFilter, setBrandFilter] = useState('All');
    // Updated trade-in tier type to include 'manual'
    const [tradeInTier, setTradeInTier] = useState<'none' | 'fair' | 'good' | 'manual'>('none');
    const [customTradeValue, setCustomTradeValue] = useState<string>('');

    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Initialize Default Model
    useEffect(() => {
        if (deviceDatabase.devices.length > 0 && !selectedModelId) {
            const flagship = deviceDatabase.devices.find(d => d.tags.includes('flagship')) || deviceDatabase.devices[0];
            if (flagship) setSelectedModelId(flagship.id);
        }
    }, [deviceDatabase, selectedModelId]);

    // Calculate max allowed lines based on the SELECTED plan (or default logic if none selected)
    const maxLinesAllowed = useMemo(() => {
        if (selectedPlanId) {
            const plan = planPricing.find(p => p.id === selectedPlanId);
            return plan?.maxLines || 12;
        }
        // Fallback for visual display before selection (take max of current type)
        const plansForType = planPricing.filter(p => p.availableFor.includes(activeTypeTab));
        if (plansForType.length === 0) return 12;
        return Math.max(...plansForType.map(p => p.maxLines));
    }, [planPricing, selectedPlanId, activeTypeTab]);

    // Determine Best Eligible Promo based on selections
    const bestEligiblePromo = useMemo(() => {
        if (!selectedModelId || !selectedPlanId) return null;
        
        const targetDevice = deviceDatabase.devices.find(d => d.id === selectedModelId);
        if (!targetDevice) return null;

        // Minimal mock config for condition checker
        const tempConfig = {
            plan: selectedPlanId,
            customerType: customerType,
            lines: lines,
            devices: [],
            accessories: [],
            discounts: { autopay: true, insider: false, thirdLineFree: false },
            fees: { activation: false },
            taxRate: 0, maxEC: 0, perLineEC: 0
        } as unknown as QuoteConfig;

        const eligible = promotions.filter(p => 
            p.isActive && 
            p.category === PromotionCategory.DEVICE &&
            // Check Device Match
            (
                (p.eligibleDeviceIds && p.eligibleDeviceIds.includes(selectedModelId)) ||
                (p.eligibleDeviceTags && targetDevice.tags.some(t => p.eligibleDeviceTags?.includes(t))) ||
                (!p.eligibleDeviceIds?.length && !p.eligibleDeviceTags?.length)
            ) &&
            // Check Conditions
            (p.conditions || []).every(c => checkCondition(tempConfig, c))
        );

        // Find max value
        let best = null;
        let maxVal = 0;

        eligible.forEach(p => {
            const val = p.effects.find(e => e.type === PromotionEffectType.DEVICE_CREDIT_FIXED)?.value || 0;
            if (val > maxVal) {
                maxVal = val;
                best = p;
            }
        });

        return best;
    }, [selectedModelId, selectedPlanId, customerType, lines, promotions, deviceDatabase]);

    // Dynamic Trade-In Value Logic
    const currentTradeInValue = useMemo(() => {
        if (tradeInTier === 'none') return 0;
        if (tradeInTier === 'fair') return 215; // Placeholder generic market value
        if (tradeInTier === 'good') {
            const promoVal = bestEligiblePromo?.effects.find(e => e.type === PromotionEffectType.DEVICE_CREDIT_FIXED)?.value;
            return promoVal || 215; // Fallback to market value if no promo
        }
        if (tradeInTier === 'manual') {
            return parseFloat(customTradeValue) || 0;
        }
        return 0;
    }, [tradeInTier, bestEligiblePromo, customTradeValue]);

    // Filter Logic for Devices
    const filteredDevices = useMemo(() => {
        return deviceDatabase.devices
            .filter(d => d.category === DeviceCategory.PHONE)
            .filter(d => brandFilter === 'All' || d.manufacturer === brandFilter)
            .filter(d => !deviceSearch || d.name.toLowerCase().includes(deviceSearch.toLowerCase()) || d.manufacturer.toLowerCase().includes(deviceSearch.toLowerCase()));
    }, [deviceDatabase.devices, brandFilter, deviceSearch]);

    // Derived Config
    const config = useMemo<QuoteConfig>(() => {
        const baseConfig = createInitialConfig(planPricing);
        const newConfig = {
            ...baseConfig,
            customerType, // Use the selected type from the plan
            lines,
            plan: selectedPlanId || baseConfig.plan,
        };

        const newDevices: Device[] = [];
        const targetModel = deviceDatabase.devices.find(d => d.id === selectedModelId) || deviceDatabase.devices[0];
        
        let countNew = 0;
        if (deviceMode === 'new') countNew = lines;
        else if (deviceMode === 'mixed') countNew = newPhoneCount;
        // else byod countNew = 0

        // Auto-Apply Promo if "Good" tier selected and promo is available
        const appliedPromoId = (tradeInTier === 'good' && bestEligiblePromo) ? bestEligiblePromo.id : null;

        for (let i = 0; i < lines; i++) {
            const isLineNewDevice = i < countNew;
            if (isLineNewDevice && targetModel) {
                newDevices.push({
                    id: crypto.randomUUID(),
                    category: DeviceCategory.PHONE,
                    modelId: targetModel.id,
                    variantSku: targetModel.variants[0]?.sku || '',
                    price: targetModel.variants[0]?.price || 800,
                    term: targetModel.defaultTermMonths,
                    downPayment: 0,
                    tradeIn: currentTradeInValue, 
                    tradeInType: tradeInTier === 'good' && currentTradeInValue > 0 ? 'promo' : 'manual',
                    appliedPromoId: appliedPromoId, 
                    isByod: false,
                });
            } else {
                newDevices.push({
                    id: crypto.randomUUID(),
                    category: DeviceCategory.PHONE,
                    price: 0,
                    term: 24,
                    downPayment: 0,
                    tradeIn: 0,
                    tradeInType: 'manual',
                    appliedPromoId: null,
                    isByod: true,
                });
            }
        }
        newConfig.devices = newDevices;
        return newConfig;
    }, [customerType, lines, deviceMode, newPhoneCount, selectedModelId, tradeInTier, currentTradeInValue, selectedPlanId, planPricing, deviceDatabase, bestEligiblePromo]);

    // Live Totals
    const totals = useMemo(() => 
        calculateQuoteTotals(config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase), 
    [config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase]);

    // Sync Session
    useEffect(() => { setSessionQuote(config); }, [config, setSessionQuote]);

    // Auto-correct lines if exceeds max allowed when switching plans/types
    useEffect(() => {
        if (lines > maxLinesAllowed) {
            setLines(maxLinesAllowed);
        }
        // Ensure newPhoneCount is within bounds
        if (newPhoneCount > lines) {
            setNewPhoneCount(lines);
        }
    }, [maxLinesAllowed, lines, newPhoneCount]);

    // Navigation Handlers
    const handleNext = () => {
        if (step === 1 && !selectedPlanId) return; // Enforce plan selection
        setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step === 1) {
            setToastMessage("Quote saved to session.");
            setView('home');
        } else {
            setStep(s => s - 1);
        }
    };

    const handleExit = () => {
        if (window.confirm("Exit wizard? Your progress is saved.")) {
            setView('home');
        }
    };

    const handleSave = async () => {
        if (!user) { setToastMessage("Please sign in to save."); return; }
        setIsSaving(true);
        try { await handleSaveOrUpdateLead(config); } 
        catch (error) { console.error(error); setToastMessage("Failed to save."); } 
        finally { setIsSaving(false); }
    };

    const availablePlansForTab = useMemo(() => planPricing.filter(p => p.availableFor.includes(activeTypeTab)), [planPricing, activeTypeTab]);

    // Updated Line Count Control
    const LineCountControl = () => (
        <div className="flex flex-col gap-6">
            {/* Main Stepper Card */}
            <div className="bg-card rounded-3xl border border-border p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                
                {/* Stepper Label */}
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 block">Total Lines</span>

                <div className="relative z-10 flex items-center gap-8 sm:gap-16 w-full justify-center">
                    <button 
                        onClick={() => setLines(l => Math.max(1, l - 1))}
                        disabled={lines <= 1}
                        className="w-16 h-16 rounded-full bg-muted text-foreground flex items-center justify-center transition-all active:scale-90 hover:bg-muted/80 disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    
                    <div className="text-center w-24">
                        <div className="text-8xl font-black text-foreground tracking-tighter leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {lines}
                        </div>
                    </div>

                    <button 
                        onClick={() => setLines(l => Math.min(maxLinesAllowed, l + 1))}
                        disabled={lines >= maxLinesAllowed}
                        className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center transition-all active:scale-90 hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none shadow-md shadow-primary/30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                </div>

                {/* Pagination Dots Visualization */}
                <div className="mt-8 flex items-center justify-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${lines >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${lines >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${lines >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                </div>
            </div>

            {/* Quick Select Bubbles */}
            <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].filter(n => n <= maxLinesAllowed).map(n => (
                    <button 
                        key={n} 
                        onClick={() => setLines(n)}
                        className={`
                            h-12 rounded-xl text-sm font-bold border transition-all duration-200
                            ${lines === n 
                                ? 'bg-foreground text-background border-foreground shadow-lg scale-105' 
                                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-primary/5'}
                        `}
                    >
                        {n}
                    </button>
                ))}
            </div>

            {/* Perks Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`
                    flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300
                    ${lines >= 3 
                        ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20' 
                        : 'bg-muted/30 border-transparent opacity-50 grayscale'}
                `}>
                    <div className={`p-2.5 rounded-xl ${lines >= 3 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-muted text-muted-foreground'}`}>
                        <Icons.Gift />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${lines >= 3 ? 'text-emerald-900 dark:text-emerald-100' : 'text-muted-foreground'}`}>3rd Line Free</p>
                        <p className="text-[10px] opacity-70">Applied to eligible tiered plans</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                    <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                        <Icons.CreditCard />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">AutoPay Savings</p>
                        <p className="text-[10px] opacity-70">Estimated ${lines * 5}/mo savings</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <MobileAppShell noPadding>
            <WizardHeader step={step} totalSteps={4} onExit={handleExit} />

            <div className="flex-1 overflow-y-auto px-5 pb-24 pt-4 scrollbar-hide">
                
                {/* STEP 1: PLAN SELECTION (Merged with Type) */}
                {step === 1 && (
                    <div className="space-y-4">
                        <StepHeading title="Select a Plan" subtitle="Choose the right rate plan for your customer." />
                        
                        {/* Type Tabs */}
                        <div className="flex p-1 bg-muted rounded-xl mb-4">
                            <button 
                                onClick={() => setActiveTypeTab(CustomerType.STANDARD)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTypeTab === CustomerType.STANDARD ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Standard
                            </button>
                            <button 
                                onClick={() => setActiveTypeTab(CustomerType.MILITARY_FR)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTypeTab === CustomerType.MILITARY_FR ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Military
                            </button>
                            <button 
                                onClick={() => setActiveTypeTab(CustomerType.PLUS_55)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTypeTab === CustomerType.PLUS_55 ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                55+
                            </button>
                        </div>

                        <div className="space-y-3">
                            {availablePlansForTab.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">No plans found for this category.</div>
                            ) : (
                                availablePlansForTab.map(plan => {
                                    const tempConfig = { ...config, plan: plan.id, customerType: activeTypeTab, lines: 1 };
                                    const planTotal = calculateQuoteTotals(tempConfig, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase);
                                    const price = planTotal ? planTotal.basePlanPriceInCents : 0;

                                    return (
                                        <WizardOptionCard 
                                            key={plan.id}
                                            title={plan.name}
                                            subtitle={plan.taxesIncluded ? "Taxes & Fees Included" : "Taxes & Fees Extra"}
                                            icon={<Icons.Signal />}
                                            theme={selectedPlanId === plan.id ? 'magenta' : 'default'}
                                            selected={selectedPlanId === plan.id}
                                            onClick={() => {
                                                setCustomerType(activeTypeTab);
                                                setSelectedPlanId(plan.id);
                                            }}
                                            price={`$${(price/100).toFixed(0)}/mo (1 Line)`}
                                            benefits={plan.features}
                                            badge={plan.id.includes('beyond') ? 'Best Value' : undefined}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: LINE COUNT */}
                {step === 2 && (
                    <div className="space-y-6">
                        <StepHeading title="Line Configuration" subtitle={`Set the number of voice lines (Max ${maxLinesAllowed}).`} />
                        <LineCountControl />
                    </div>
                )}

                {/* STEP 3: DEVICES - REDESIGNED */}
                {step === 3 && (
                    <div className="space-y-6">
                        <StepHeading title="Device Setup" subtitle="Choose equipment and trade-in options." />
                        
                        {/* 1. Strategy Segmented Control (Pill Style) */}
                        <div className="bg-muted p-1 rounded-full flex gap-1 shadow-inner relative">
                            <button
                                onClick={() => setDeviceMode('new')}
                                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 z-10 ${deviceMode === 'new' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                New
                            </button>
                            <button
                                onClick={() => setDeviceMode('byod')}
                                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 z-10 ${deviceMode === 'byod' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                BYOD
                            </button>
                            <button
                                onClick={() => setDeviceMode('mixed')}
                                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 z-10 ${deviceMode === 'mixed' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Mix
                            </button>
                        </div>
                        
                        {/* Mixed Mode Counter */}
                        {deviceMode === 'mixed' && (
                            <div className="flex items-center justify-between bg-card border border-border p-4 rounded-2xl animate-fade-in-down shadow-sm">
                                <div className="text-sm">
                                    <span className="font-bold text-foreground block">New Phones</span>
                                    <p className="text-xs text-muted-foreground">Remaining {lines - newPhoneCount} lines are BYOD</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setNewPhoneCount(c => Math.max(1, c - 1))} 
                                        className="w-10 h-10 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    </button>
                                    <span className="text-xl font-bold w-6 text-center tabular-nums">{newPhoneCount}</span>
                                    <button 
                                        onClick={() => setNewPhoneCount(c => Math.min(lines - 1, c + 1))} 
                                        className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-md transition-transform active:scale-95"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Device List Selection */}
                        {deviceMode !== 'byod' && (
                            <div className="space-y-4 animate-fade-in-down">
                                
                                {/* Search & Filters Container - Sticky */}
                                <div className="space-y-3 sticky top-0 bg-background/95 backdrop-blur z-20 pb-2 -mx-1 px-1">
                                    {/* Search Input - Dark style */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                                            <Icons.Search />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Search devices..." 
                                            value={deviceSearch}
                                            onChange={(e) => setDeviceSearch(e.target.value)}
                                            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-zinc-900 text-white border-none focus:ring-2 focus:ring-primary/50 text-sm font-medium outline-none transition-all placeholder:text-zinc-500 shadow-lg shadow-zinc-900/10"
                                        />
                                        {deviceSearch && (
                                            <button 
                                                onClick={() => setDeviceSearch('')}
                                                className="absolute inset-y-0 right-0 flex items-center px-4 text-white/50 hover:text-white transition-colors"
                                            >
                                                <Icons.X />
                                            </button>
                                        )}
                                    </div>

                                    {/* Brand Filters */}
                                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                        {['All', 'Apple', 'Samsung', 'Google', 'Motorola', 'OnePlus'].map(brand => (
                                            <button
                                                key={brand}
                                                onClick={() => setBrandFilter(brand)}
                                                className={`
                                                    px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200
                                                    ${brandFilter === brand 
                                                        ? 'bg-foreground text-background shadow-md transform scale-105' 
                                                        : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                                                    }
                                                `}
                                            >
                                                {brand}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-hide pb-2">
                                    {filteredDevices.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <p className="text-sm">No devices found.</p>
                                        </div>
                                    ) : (
                                        filteredDevices.map(device => {
                                        const monthlyPrice = (device.variants[0]?.price || 0) / 24;
                                        const isSelected = selectedModelId === device.id;
                                        
                                        return (
                                            <button
                                                key={device.id}
                                                onClick={() => setSelectedModelId(device.id)}
                                                className={`w-full flex items-center p-3 rounded-2xl border-2 transition-all text-left group relative overflow-hidden bg-card
                                                    ${isSelected 
                                                        ? 'border-primary shadow-md shadow-primary/10 z-10' 
                                                        : 'border-transparent shadow-sm hover:border-border hover:shadow-md'
                                                    }`}
                                            >
                                                {/* Icon Container */}
                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                    {device.manufacturer === 'Apple' ? <Icons.Apple /> : <Icons.Android />}
                                                </div>
                                                
                                                {/* Text Content */}
                                                <div className="ml-3 flex-1 min-w-0 pr-2">
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                        <span className={`font-bold text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                            {device.name}
                                                        </span>
                                                        {device.tags.includes('flagship') && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 uppercase tracking-wide border border-yellow-500/20">
                                                                Flagship
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground font-medium">{device.manufacturer}</p>
                                                </div>

                                                {/* Price */}
                                                <div className="flex flex-col items-end shrink-0 pl-2">
                                                    <span className="text-sm font-bold tabular-nums text-foreground">${monthlyPrice.toFixed(2)}<span className="text-[10px] font-normal text-muted-foreground">/mo</span></span>
                                                    <span className="text-[10px] text-muted-foreground">For 24 mo.</span>
                                                </div>
                                            </button>
                                        );
                                    }))}
                                </div>
                            </div>
                        )}

                        {/* Trade-In Options - Smart Promo Integration with Manual Option */}
                        {deviceMode !== 'byod' && (
                            <div className="space-y-4 animate-fade-in-down pt-2 border-t border-border/50">
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trade-In Offer</p>
                                    {bestEligiblePromo && (
                                        <span className="text-[9px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded uppercase tracking-wide">
                                            Promo Found
                                        </span>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Option 1: No Trade-In */}
                                    <button 
                                        onClick={() => setTradeInTier('none')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all bg-card h-28
                                            ${tradeInTier === 'none' 
                                                ? 'border-foreground ring-1 ring-foreground z-10 shadow-sm' 
                                                : 'border-border hover:border-muted-foreground/30'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mb-2">
                                            <Icons.X />
                                        </div>
                                        <span className="font-bold text-sm text-foreground">No Trade-In</span>
                                    </button>

                                    {/* Option 2: Generic Market Value */}
                                    <button 
                                        onClick={() => setTradeInTier('fair')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all bg-card h-28
                                            ${tradeInTier === 'fair' 
                                                ? 'border-foreground ring-1 ring-foreground z-10 shadow-sm' 
                                                : 'border-border hover:border-muted-foreground/30'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mb-2">
                                            <Icons.Recycle />
                                        </div>
                                        <span className="font-bold text-sm text-foreground">Market</span>
                                        <span className="text-[10px] text-muted-foreground mt-1">~$215</span>
                                    </button>

                                    {/* Option 3: Promo / Good Condition */}
                                    <button 
                                        onClick={() => setTradeInTier('good')}
                                        disabled={!bestEligiblePromo}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all relative overflow-hidden h-28
                                            ${tradeInTier === 'good' 
                                                ? 'bg-primary/5 border-primary ring-1 ring-primary z-10 shadow-md' 
                                                : bestEligiblePromo 
                                                    ? 'bg-card border-border hover:border-primary/50' 
                                                    : 'bg-muted/30 border-transparent opacity-50 cursor-not-allowed'
                                            }`}
                                    >
                                        {bestEligiblePromo && (
                                            <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                                                PROMO
                                            </div>
                                        )}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-2 ${tradeInTier === 'good' ? 'bg-primary text-white' : 'bg-muted'}`}>
                                            <Icons.Gift />
                                        </div>
                                        <span className={`font-bold text-sm ${tradeInTier === 'good' ? 'text-primary' : 'text-foreground'}`}>
                                            Promo
                                        </span>
                                        <span className="text-[10px] text-muted-foreground mt-1">
                                            {bestEligiblePromo ? `~$${bestEligiblePromo.effects.find(e => e.type === PromotionEffectType.DEVICE_CREDIT_FIXED)?.value}` : 'N/A'}
                                        </span>
                                    </button>

                                    {/* Option 4: Manual Entry */}
                                    <button 
                                        onClick={() => setTradeInTier('manual')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all bg-card h-28
                                            ${tradeInTier === 'manual' 
                                                ? 'border-foreground ring-1 ring-foreground z-10 shadow-sm' 
                                                : 'border-border hover:border-muted-foreground/30'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mb-2">
                                            <Icons.Edit />
                                        </div>
                                        <span className="font-bold text-sm text-foreground">Manual</span>
                                    </button>
                                </div>

                                {/* Manual Input Field */}
                                {tradeInTier === 'manual' && (
                                    <div className="mt-3 animate-fade-in-down p-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block pl-1">
                                            Enter Trade-In Value
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground font-bold">$</span>
                                            <input 
                                                type="number" 
                                                value={customTradeValue}
                                                onChange={(e) => setCustomTradeValue(e.target.value)}
                                                className="w-full h-12 pl-7 pr-4 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-lg shadow-sm"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: REVIEW */}
                {step === 4 && (
                    <div className="space-y-6">
                        <StepHeading title="Review Quote" subtitle="Here is your estimated breakdown." />
                        
                        <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm">
                            <div className="bg-gradient-to-b from-primary/5 to-transparent p-6 text-center border-b border-border/50">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Estimated Monthly</p>
                                <div className="flex items-start justify-center gap-1">
                                    <span className="text-2xl font-bold text-foreground mt-1">$</span>
                                    <span className="text-5xl font-black font-mono text-foreground tracking-tighter">
                                        {totals ? (totals.totalMonthlyInCents/100).toFixed(0) : '0'}
                                    </span>
                                </div>
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-background/80 backdrop-blur rounded-full border border-border/50 shadow-sm">
                                    <span className="text-xs text-muted-foreground font-medium">Due Today:</span>
                                    <span className="text-xs font-bold font-mono text-foreground">${totals ? (totals.dueTodayInCents/100).toFixed(2) : '0.00'}</span>
                                </div>
                            </div>
                            <div className="p-5 space-y-3 bg-muted/20">
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-muted-foreground font-medium">Plan</span>
                                    <span className="font-bold text-foreground">{totals?.planName}</span>
                                </div>
                                <div className="h-px bg-border/50 w-full" />
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-muted-foreground font-medium">Structure</span>
                                    <span className="font-bold text-foreground">{config.lines} Voice Lines</span>
                                </div>
                                <div className="h-px bg-border/50 w-full" />
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-muted-foreground font-medium">Hardware</span>
                                    <span className="font-bold text-foreground">
                                        {deviceMode === 'byod' ? 'All BYOD' : `${config.devices.filter(d => !d.isByod).length} New Devices`}
                                    </span>
                                </div>
                                {totals && totals.totalDiscountsInCents > 0 && (
                                    <>
                                    <div className="h-px bg-border/50 w-full" />
                                    <div className="flex justify-between text-sm items-center text-emerald-600 dark:text-emerald-400">
                                        <span className="font-bold">Total Savings</span>
                                        <span className="font-mono font-bold">-${(totals.totalDiscountsInCents/100).toFixed(2)}</span>
                                    </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button 
                                variant="secondary" 
                                className="h-12 rounded-xl font-bold border border-border bg-background hover:bg-muted"
                                onClick={() => setView('new-quote')}
                            >
                                Edit Full Details
                            </Button>
                            <Button 
                                className="h-12 rounded-xl font-bold shadow-md shadow-primary/20"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Lead'}
                            </Button>
                        </div>
                    </div>
                )}

            </div>

            {/* Floating Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none flex justify-center pb-safe-bottom">
                <div className="w-full max-w-md pointer-events-auto flex gap-3">
                    <button 
                        onClick={handleBack} 
                        className="h-14 w-14 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                    >
                        <Icons.ChevronLeft />
                    </button>
                    
                    {step < 4 && (
                        <button 
                            onClick={handleNext} 
                            disabled={step === 1 && !selectedPlanId}
                            className="flex-1 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/25 font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            <span>{step === 1 ? 'Get Started' : 'Continue'}</span>
                            <Icons.ChevronRight />
                        </button>
                    )}
                </div>
            </div>
        </MobileAppShell>
    );
};

export default QuoteWizard;
