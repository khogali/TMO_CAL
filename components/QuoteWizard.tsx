
import React, { useState, useMemo, useEffect } from 'react';
import { useData, useUI } from '../context/AppContext';
import { createInitialConfig } from '../constants';
import { calculateQuoteTotals } from '../utils/calculations';
import { QuoteConfig, DeviceCategory, PlanDetails, CustomerType, Device, AccessoryPaymentType, DeviceModel, Accessory, PromotionCategory, CalculatedTotals, ServicePlan, Promotion, PromotionEffectType } from '../types';
import { checkCondition } from '../utils/conditionUtils';
import Button from './ui/Button';
import Input from './ui/Input';
import ButtonGroup from './ui/ButtonGroup';

// --- Helper Components ---

const StepIndicator: React.FC<{ 
    currentStep: number; 
    totalSteps: number; 
    setStep: (step: number) => void 
}> = ({ currentStep, totalSteps, setStep }) => (
    <div className="bg-card/80 backdrop-blur-md border-b border-border/50 px-6 pt-4 pb-3 sticky top-0 z-20 shadow-sm transition-all">
        <div className="max-w-3xl mx-auto w-full">
            <div className="flex justify-between mb-2">
                {[1, 2, 3, 4].map((step) => {
                    const isActive = step === currentStep;
                    const isCompleted = step < currentStep;
                    const canJump = step < currentStep; // Allow jumping back
                    
                    let label = 'Plan';
                    if (step === 2) label = 'Phones';
                    if (step === 3) label = 'Connect';
                    if (step === 4) label = 'Finalize';

                    return (
                        <div 
                            key={step} 
                            onClick={() => canJump && setStep(step)}
                            className={`flex flex-col items-center gap-1.5 relative z-10 ${canJump ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                                ${isActive ? 'bg-primary text-white scale-110 shadow-lg ring-4 ring-primary/10' : 
                                  isCompleted ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}
                            `}>
                                {isCompleted ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                ) : step}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
                {/* Progress Bar Background */}
                <div className="absolute top-4 left-0 w-full h-0.5 bg-muted -z-10 hidden md:block" />
            </div>
        </div>
    </div>
);

const WizardActionBar: React.FC<{
    step: number;
    totalSteps: number;
    onBack: () => void;
    onNext: () => void;
    onFinish: () => void;
    canGoNext: boolean;
    totalMonthly?: number;
}> = ({ step, totalSteps, onBack, onNext, onFinish, canGoNext, totalMonthly }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 px-4">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                
                {/* Back Button */}
                <Button 
                    variant="ghost" 
                    onClick={onBack} 
                    className="text-muted-foreground hover:text-foreground w-24"
                >
                    {step === 1 ? 'Exit' : 'Back'}
                </Button>

                {/* Middle Info (Price preview) */}
                <div className="flex flex-col items-center">
                    {totalMonthly !== undefined && (
                        <>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:block">Est. Monthly</span>
                            <span className="text-xl font-black text-foreground">${totalMonthly.toFixed(0)}</span>
                        </>
                    )}
                </div>

                {/* Next/Finish Button */}
                {step < totalSteps ? (
                    <Button 
                        onClick={onNext} 
                        disabled={!canGoNext}
                        className="w-24 md:w-32 shadow-lg rounded-xl font-bold"
                    >
                        Next
                    </Button>
                ) : (
                    <Button 
                        onClick={onFinish} 
                        className="w-32 md:w-40 shadow-lg bg-primary hover:bg-primary/90 text-white rounded-xl font-bold"
                    >
                        Finish
                    </Button>
                )}
            </div>
        </div>
    );
};

// --- New Plan Card Design (List Style) ---
const PlanCard: React.FC<{
    plan: PlanDetails;
    isSelected: boolean;
    onClick: () => void;
    totalPrice: number;
    lines: number;
}> = ({ plan, isSelected, onClick, totalPrice, lines }) => (
    <button 
        onClick={onClick}
        className={`
            relative w-full text-left rounded-2xl p-4 transition-all duration-200 border-2
            flex items-center gap-4 group
            ${isSelected 
                ? 'border-primary bg-background shadow-lg ring-1 ring-primary/20 z-10' 
                : 'border-transparent bg-card/60 hover:bg-card hover:border-border hover:shadow-md'
            }
        `}
    >
        {/* Icon (Flask) */}
        <div className={`
            w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform duration-300
            ${isSelected ? 'bg-primary/10 text-primary scale-105' : 'bg-muted/50 text-muted-foreground group-hover:scale-105'}
        `}>
            {/* Beaker / Flask Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21a1.5 1.5 0 001.5-1.5v-4.5a1.5 1.5 0 00-.44-1.06L14 7.5V3.75a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75V7.5L3.44 13.94A1.5 1.5 0 003 15v4.5A1.5 1.5 0 004.5 21h15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6" />
            </svg>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <div className="text-base sm:text-lg font-bold text-foreground leading-tight truncate">{plan.name}</div>
                {plan.name.includes('Beyond') && <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Best</span>}
            </div>
            {/* Features preview or spacer */}
            <div className="text-xs text-muted-foreground truncate opacity-80">
                {plan.features?.slice(0, 2).join(', ')}
            </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
             <div className="flex items-baseline justify-end gap-1">
                <span className={`text-xl font-extrabold tracking-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    ${lines > 0 ? (totalPrice / lines).toFixed(0) : 0}
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase">/line</span>
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                ${totalPrice.toFixed(0)}/mo
            </div>
        </div>
    </button>
);

// --- Segment Card Component ---
const SegmentCard: React.FC<{
    type: CustomerType;
    isSelected: boolean;
    onClick: () => void;
}> = ({ type, isSelected, onClick }) => {
    const getIcon = () => {
        switch(type) {
            case CustomerType.STANDARD: 
                // Users Group
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
            case CustomerType.MILITARY_FR: 
                // Shield / Military
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;
            case CustomerType.PLUS_55: 
                // Single User
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
            default: return <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>;
        }
    };

    return (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 h-28 w-full
                ${isSelected 
                    ? 'border-primary bg-background shadow-md scale-105 z-10' 
                    : 'border-transparent bg-white dark:bg-card/50 hover:bg-card hover:border-border/50 hover:shadow-sm'
                }
            `}
        >
            <div className={`mb-3 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/70'}`}>
                {getIcon()}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                {type}
            </span>
        </button>
    );
};

// --- New Device Card Design (List Style) ---
const VisualDeviceCard: React.FC<{
    device: DeviceModel;
    isSelected: boolean;
    onClick: () => void;
}> = ({ device, isSelected, onClick }) => {
    const price = device.variants[0]?.price || 0;
    const monthly = (price / 24).toFixed(2);

    return (
        <button 
            onClick={onClick}
            className={`
                relative w-full text-left rounded-2xl p-3 sm:p-4 transition-all duration-200 border-2
                flex items-center gap-4 group
                ${isSelected 
                    ? 'border-primary bg-background shadow-lg ring-1 ring-primary/20 z-10' 
                    : 'border-transparent bg-card/60 hover:bg-card hover:border-border hover:shadow-md'
                }
            `}
        >
            {/* Icon */}
            <div className={`
                w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl shadow-sm transition-transform duration-300
                ${isSelected ? 'bg-gradient-to-br from-primary to-pink-600 text-white scale-110' : 'bg-muted text-muted-foreground group-hover:scale-105'}
            `}>
                {device.manufacturer === 'Apple' ? '' : device.manufacturer[0]}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{device.manufacturer}</span>
                    {device.tags.includes('new_release') && <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>}
                </div>
                <div className="text-sm sm:text-base font-bold text-foreground leading-tight truncate">{device.name}</div>
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
                 <div className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    ${monthly}/mo
                </div>
                <div className="text-[10px] text-muted-foreground">
                    ${price} retail
                </div>
            </div>
        </button>
    );
};

// --- BTS Selection Card (Redesigned & Fixed) ---
const BtsCard: React.FC<{
    device: DeviceModel;
    count: number;
    onIncrement: () => void;
    onDecrement: () => void;
    servicePlans: ServicePlan[];
    promotions: Promotion[];
    config: QuoteConfig;
}> = ({ device, count, onIncrement, onDecrement, servicePlans, promotions, config }) => {
    const isSelected = count > 0;
    
    // Calculate Costs
    const devicePrice = device.variants[0]?.price || 0;
    const deviceMonthly = devicePrice / 24;
    
    // Determine default plan (popular) based on category
    const defaultPlan = servicePlans.find(p => p.deviceCategory === device.category && p.isPopular) || 
                        servicePlans.find(p => p.deviceCategory === device.category);
    const planPrice = defaultPlan?.price || 0;

    // Check for BTS Promotions
    // Filter specifically for BTS category promos
    const eligiblePromos = promotions.filter(p => 
        p.isActive && 
        p.category === PromotionCategory.BTS && 
        (!p.eligibleDeviceIds?.length || p.eligibleDeviceIds.includes(device.id)) &&
        (p.conditions || []).every(c => checkCondition(config, c))
    );

    const activePromo = eligiblePromos.length > 0 ? eligiblePromos[0] : null;
    
    let promoSavings = 0;
    if (activePromo) {
        activePromo.effects.forEach(e => {
            if (e.type === PromotionEffectType.SERVICE_PLAN_DISCOUNT_FIXED) promoSavings += e.value;
        });
    }

    const netMonthly = deviceMonthly + planPrice - promoSavings;

    return (
        <div 
            className={`
                relative w-full rounded-2xl p-3 sm:p-4 transition-all duration-200 border-2
                flex items-center gap-4 group
                ${isSelected 
                    ? 'border-primary bg-background shadow-lg ring-1 ring-primary/20 z-10' 
                    : 'border-transparent bg-card/60 hover:bg-card hover:border-border hover:shadow-md'
                }
            `}
        >
            {/* Icon - Using Manufacturer Logo/Initial like Phone Cards */}
            <div className={`
                w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl shadow-sm transition-transform duration-300
                ${isSelected ? 'bg-gradient-to-br from-primary to-pink-600 text-white scale-110' : 'bg-muted text-muted-foreground group-hover:scale-105'}
            `}>
                {device.manufacturer === 'Apple' ? '' : device.manufacturer[0]}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{device.manufacturer}</span>
                    {device.tags.includes('new_release') && <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>}
                </div>
                <div className="text-sm sm:text-base font-bold text-foreground leading-tight truncate">{device.name}</div>
                
                {/* Plan & Promo Details */}
                <div className="flex flex-wrap gap-2 mt-1">
                    {defaultPlan && (
                        <span className="inline-flex items-center text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                            {defaultPlan.name}
                        </span>
                    )}
                    {activePromo && (
                        <span className="inline-flex items-center text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800">
                            {activePromo.name}
                        </span>
                    )}
                </div>
            </div>

            {/* Price & Actions */}
            <div className="flex flex-col items-end gap-1">
                <div className="text-right">
                     <div className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        ${netMonthly.toFixed(2)}<span className="text-[10px] font-medium text-muted-foreground">/mo</span>
                    </div>
                    {promoSavings > 0 && isSelected && (
                        <div className="text-[10px] text-green-600 line-through decoration-muted-foreground/50">
                            ${(deviceMonthly + planPrice).toFixed(2)}
                        </div>
                    )}
                </div>

                {count === 0 ? (
                    <button 
                        onClick={onIncrement}
                        className="h-8 px-4 rounded-lg bg-muted hover:bg-primary hover:text-white text-xs font-bold text-foreground transition-all active:scale-95 border border-transparent"
                    >
                        Add
                    </button>
                ) : (
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 shrink-0 border border-border shadow-sm h-8">
                        <button 
                            onClick={onDecrement} 
                            className="w-7 h-full flex items-center justify-center rounded-md bg-background text-foreground hover:text-red-500 shadow-sm transition-colors active:scale-95"
                        >
                            −
                        </button>
                        <span className="font-bold text-foreground w-5 text-center tabular-nums text-xs">{count}</span>
                        <button 
                            onClick={onIncrement} 
                            className="w-7 h-full flex items-center justify-center rounded-md bg-primary text-white shadow-sm transition-colors active:scale-95 hover:bg-primary/90"
                        >
                            +
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Trade-In Configuration Type ---
interface TradeInConfigItem {
    type: 'none' | 'manual' | 'promo';
    value: number;
    promoId: string;
}

// --- Main Wizard Component ---

const QuoteWizard: React.FC = () => {
    const { setView, setToastMessage } = useUI();
    const { planPricing, applyWizardConfig, deviceDatabase, insurancePlans, discountSettings, servicePlans, promotions } = useData();
    const [step, setStep] = useState(1);

    // --- Wizard State ---
    const [lines, setLines] = useState<number>(1);
    const [customerType, setCustomerType] = useState<CustomerType>(CustomerType.STANDARD);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [addAutopay, setAddAutopay] = useState(true);
    
    // Device State (Phones)
    const [newPhoneCount, setNewPhoneCount] = useState<number>(1);
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [deviceSelectionMode, setDeviceSelectionMode] = useState<'unified' | 'mixed'>('unified');
    const [individualSelections, setIndividualSelections] = useState<string[]>([]);
    const [activeSlotIndex, setActiveSlotIndex] = useState(0);

    // BTS State
    const [btsCounts, setBtsCounts] = useState<Record<string, number>>({});
    const [btsCategory, setBtsCategory] = useState<DeviceCategory>(DeviceCategory.WATCH);

    // Trade-In State (Granular)
    const [tradeInSelections, setTradeInSelections] = useState<TradeInConfigItem[]>([]);

    // Extras State
    const [addP360, setAddP360] = useState(false);
    const [accessoryTier, setAccessoryTier] = useState<'none' | 'essentials' | 'complete'>('none');
    const [addInsider, setAddInsider] = useState(false);
    const [addThirdLineFree, setAddThirdLineFree] = useState(true); // Default on if eligible
    const [includeActivation, setIncludeActivation] = useState(true); // Default ON
    const [showAdvancedFinancing, setShowAdvancedFinancing] = useState(false);
    
    // Credit State
    const [maxEC, setMaxEC] = useState(6500);
    const [perLineEC, setPerLineEC] = useState(1500);

    // Scroll to top when step changes
    useEffect(() => {
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            mainContainer.scrollTo({ top: 0, behavior: 'auto' });
        } else {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [step]);

    // --- Live Configuration & Totals ---
    const liveConfig = useMemo(() => {
        const baseConfig = createInitialConfig(planPricing);
        const byodCount = Math.max(0, Number(lines) - Number(newPhoneCount));
        const devices: Device[] = [];

        // Add New Phones
        for (let i = 0; i < Number(newPhoneCount); i++) {
            const modelId = deviceSelectionMode === 'unified' ? selectedModelId : (individualSelections[i] || selectedModelId);
            const model = deviceDatabase.devices.find(d => d.id === modelId);
            const p360Plan = insurancePlans.find(p => p.id === 'p360');
            
            // Get trade-in config for this line
            // If unified, use the first one as master. If mixed, use specific index.
            const tradeInConfig = deviceSelectionMode === 'unified' ? tradeInSelections[0] : tradeInSelections[i];
            const currentTradeIn = tradeInConfig || { type: 'none', value: 0, promoId: '' };

            if (modelId) {
                devices.push({
                    id: `temp-dev-${i}`,
                    category: DeviceCategory.PHONE,
                    modelId: modelId,
                    variantSku: model?.variants[0]?.sku || '',
                    price: model?.variants[0]?.price || 800,
                    term: model?.defaultTermMonths || 24,
                    downPayment: 0,
                    tradeIn: currentTradeIn.type === 'manual' ? currentTradeIn.value : 0, 
                    tradeInType: currentTradeIn.type === 'promo' ? 'promo' : 'manual', 
                    appliedPromoId: currentTradeIn.type === 'promo' ? currentTradeIn.promoId : null,
                    isByod: false,
                    insuranceId: addP360 ? p360Plan?.id : undefined
                });
            }
        }

        // Add BYOD
        for (let i = 0; i < byodCount; i++) {
            const p360Plan = insurancePlans.find(p => p.id === 'p360'); 
            devices.push({
                id: `temp-byod-${i}`,
                category: DeviceCategory.PHONE,
                price: 0,
                term: 24,
                downPayment: 0,
                tradeIn: 0,
                tradeInType: 'manual',
                appliedPromoId: null,
                isByod: true,
                insuranceId: addP360 ? p360Plan?.id : undefined 
            });
        }

        // Add BTS Devices
        Object.entries(btsCounts).forEach(([modelId, countVal]) => {
            const count = Number(countVal);
            if (count > 0) {
                const model = deviceDatabase.devices.find(d => d.id === modelId);
                const popularPlan = servicePlans.find(p => p.deviceCategory === model?.category && p.isPopular);
                const protection = insurancePlans.find(p => p.supportedCategories?.includes(model?.category as any) && p.id.includes('p360'));

                if (model) {
                    for (let k = 0; k < count; k++) {
                        // Apply BTS Promo Logic directly here for accurate totals
                        const promo = promotions.find(p => 
                            p.isActive && 
                            p.category === PromotionCategory.BTS && 
                            (!p.eligibleDeviceIds?.length || p.eligibleDeviceIds.includes(model.id))
                        );

                        devices.push({
                            id: `temp-bts-${modelId}-${k}`,
                            category: model.category,
                            modelId: model.id,
                            variantSku: model.variants[0]?.sku || '',
                            price: model.variants[0]?.price || 0,
                            term: 24,
                            downPayment: 0,
                            tradeIn: 0,
                            tradeInType: 'manual',
                            appliedPromoId: null, // Device promo ID (usually none for BTS)
                            isByod: false,
                            servicePlanId: popularPlan?.id,
                            insuranceId: addP360 ? protection?.id : undefined,
                            // Note: Service promos are applied in calculateQuoteTotals based on conditions
                        });
                    }
                }
            }
        });

        const accessories: Accessory[] = [];
        if (accessoryTier !== 'none' && Number(newPhoneCount) > 0) {
            // Case + Screen Protector for 'essentials' or 'complete'
            accessories.push({
                id: 'temp-acc-case',
                name: 'Protective Case',
                price: 60,
                paymentType: AccessoryPaymentType.FINANCED,
                quantity: Number(newPhoneCount),
                term: 12,
                downPayment: 0
            });
            accessories.push({
                id: 'temp-acc-screen',
                name: 'Screen Protector',
                price: 60,
                paymentType: AccessoryPaymentType.FINANCED,
                quantity: Number(newPhoneCount),
                term: 12,
                downPayment: 0
            });

            // 'complete' also gets Charging Block
            if (accessoryTier === 'complete') {
                accessories.push({
                    id: 'temp-acc-block',
                    name: 'Charging Block',
                    price: 20,
                    paymentType: AccessoryPaymentType.FINANCED,
                    quantity: Number(newPhoneCount),
                    term: 12,
                    downPayment: 0
                });
            }
        }

        return {
            ...baseConfig,
            lines: Number(lines),
            plan: selectedPlanId || baseConfig.plan,
            customerType,
            maxEC,
            perLineEC,
            discounts: {
                autopay: addAutopay,
                insider: addInsider,
                thirdLineFree: addThirdLineFree
            },
            fees: {
                activation: includeActivation,
            },
            devices,
            accessories
        } as QuoteConfig;
    }, [planPricing, lines, customerType, selectedPlanId, addAutopay, addInsider, addThirdLineFree, includeActivation, newPhoneCount, selectedModelId, tradeInSelections, deviceSelectionMode, individualSelections, addP360, accessoryTier, maxEC, perLineEC, deviceDatabase, insurancePlans, btsCounts, servicePlans, promotions]);

    const liveTotals: CalculatedTotals | null = useMemo(() => {
        return calculateQuoteTotals(liveConfig, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase);
    }, [liveConfig, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase]);


    // --- Derived Data ---
    const availablePlans = useMemo(() => {
        return planPricing.filter(p => p.availableFor.includes(customerType));
    }, [planPricing, customerType]);

    const phoneOptions = useMemo(() => {
        return deviceDatabase.devices
            .filter(d => d.category === DeviceCategory.PHONE)
            .sort((a, b) => b.variants[0].price - a.variants[0].price);
    }, [deviceDatabase]);

    const btsOptions = useMemo(() => {
        return deviceDatabase.devices
            .filter(d => d.category === btsCategory)
            .sort((a, b) => b.variants[0].price - a.variants[0].price);
    }, [deviceDatabase, btsCategory]);

    const currentPlanDetails: PlanDetails | undefined = useMemo(() => {
        return planPricing.find(p => p.id === selectedPlanId);
    }, [planPricing, selectedPlanId]);

    const maxLines: number = (currentPlanDetails?.maxLines ?? 12);

    // Effects
    useEffect(() => {
        if (Number(lines) > maxLines) {
            setLines(maxLines);
            setToastMessage(`Plan limit reached: Adjusted to ${maxLines} lines`);
        }
    }, [maxLines, lines, setToastMessage]);

    useEffect(() => {
        setIndividualSelections((prev: string[]) => {
            const count = Number(newPhoneCount);
            const newArr = new Array(count).fill(selectedModelId);
            const limit = Math.min(prev.length, count);
            for (let i = 0; i < Number(limit); i++) {
                newArr[i] = prev[i];
            }
            return newArr;
        });
        
        setTradeInSelections((prev: TradeInConfigItem[]) => {
            const count = Number(newPhoneCount);
            const newArr: TradeInConfigItem[] = new Array(count).fill({ type: 'none', value: 0, promoId: '' });
            const limit = Math.min(prev.length, count);
            for (let i = 0; i < Number(limit); i++) {
                newArr[i] = prev[i];
            }
            return newArr;
        });

        if (activeSlotIndex >= Number(newPhoneCount)) {
            setActiveSlotIndex(Math.max(0, Number(newPhoneCount) - 1));
        }
    }, [newPhoneCount, selectedModelId, activeSlotIndex]);

    useEffect(() => {
        if (phoneOptions.length > 0 && !selectedModelId) setSelectedModelId(phoneOptions[0].id);
        if (Number(newPhoneCount) > Number(lines)) setNewPhoneCount(lines);
    }, [lines, phoneOptions, selectedModelId, newPhoneCount]);

    useEffect(() => {
        if (availablePlans.length > 0) {
            const currentPlanValid = availablePlans.find(p => p.id === selectedPlanId);
            if (!currentPlanValid) {
                const defaultPlan = availablePlans.find(p => p.id.includes('plus') || p.id.includes('more')) || availablePlans[0];
                setSelectedPlanId(defaultPlan.id);
            }
        }
    }, [availablePlans, selectedPlanId]);

    const handleExit = () => {
        setView('home');
    };

    const handleFinish = () => {
        // Generate stable IDs
        const finalConfig = { ...liveConfig };
        finalConfig.devices = finalConfig.devices.map(d => ({ ...d, id: crypto.randomUUID() }));
        finalConfig.accessories = finalConfig.accessories.map(a => ({ ...a, id: crypto.randomUUID() }));
        applyWizardConfig(finalConfig);
    };

    const handleTradeInChange = (field: keyof TradeInConfigItem, value: string | number) => {
        setTradeInSelections(prev => {
            const newArr = [...prev];
            if (deviceSelectionMode === 'unified') {
                // Apply to all
                const current = newArr[0] || { type: 'none', value: 0, promoId: '' };
                const newItem = { ...current, [field]: value } as TradeInConfigItem;
                return new Array(Number(newPhoneCount)).fill(newItem);
            } else {
                // Apply to active slot
                const current = newArr[activeSlotIndex] || { type: 'none', value: 0, promoId: '' };
                newArr[activeSlotIndex] = { ...current, [field]: value } as TradeInConfigItem;
                return newArr;
            }
        });
    };

    const handleBtsCountChange = (modelId: string, delta: number) => {
        setBtsCounts(prev => {
            const current = prev[modelId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [modelId]: next };
        });
    };

    // Get current trade-in state for UI
    const currentTradeInState: TradeInConfigItem = deviceSelectionMode === 'unified' 
        ? (tradeInSelections[0] || { type: 'none', value: 0, promoId: '' })
        : (tradeInSelections[activeSlotIndex] || { type: 'none', value: 0, promoId: '' });

    // Filter promos for the currently selected device
    const currentDeviceModelId = deviceSelectionMode === 'unified' ? selectedModelId : individualSelections[activeSlotIndex];
    const availableDevicePromos = useMemo(() => {
        return promotions.filter(p => {
            if (!p.isActive || p.category !== PromotionCategory.DEVICE) return false;
            
            // If specific device is selected, filter by compatibility
            if (currentDeviceModelId) {
                const model = deviceDatabase.devices.find(d => d.id === currentDeviceModelId);
                if (model) {
                    const hasIdMatch = p.eligibleDeviceIds && p.eligibleDeviceIds.includes(currentDeviceModelId);
                    const hasTagMatch = p.eligibleDeviceTags && p.eligibleDeviceTags.length > 0 && model.tags.some(t => p.eligibleDeviceTags?.includes(t));
                    const hasConstraints = (p.eligibleDeviceIds?.length || 0) > 0 || (p.eligibleDeviceTags?.length || 0) > 0;
                    if (hasConstraints && !hasIdMatch && !hasTagMatch) return false;
                }
            }
            return true;
        });
    }, [promotions, currentDeviceModelId, deviceDatabase]);

    const totalBtsCount: number = Object.values(btsCounts).reduce<number>((a, b) => a + Number(b), 0);

    const canGoNext = useMemo(() => {
        if (step === 1) return !!selectedPlanId;
        return true;
    }, [step, selectedPlanId]);

    return (
        <div className="flex flex-col h-full bg-background w-full max-w-5xl mx-auto relative">
            
            <StepIndicator currentStep={step} totalSteps={4} setStep={setStep} />

            {/* Step 1: Plan & Lines (Redesigned) */}
            {step === 1 && (
                <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in-down bg-muted/20">
                    <div className="flex-1 overflow-y-auto pb-32 px-4 sm:px-6">
                        <div className="max-w-5xl mx-auto py-6 space-y-8">
                            
                            {/* Line Counter */}
                            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm text-center relative overflow-hidden">
                                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Voice Lines</h2>
                                <div className="flex items-center justify-center gap-6 mb-6">
                                    <button 
                                        onClick={() => setLines(Math.max(1, Number(lines) - 1))}
                                        className="w-12 h-12 rounded-2xl bg-muted hover:bg-border text-foreground flex items-center justify-center text-2xl font-bold transition-all active:scale-95"
                                    >
                                        −
                                    </button>
                                    <div className="text-6xl font-black text-foreground tabular-nums tracking-tighter">
                                        {lines}
                                    </div>
                                    <button 
                                        onClick={() => setLines(Math.min(maxLines, Number(lines) + 1))}
                                        className="w-12 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center text-2xl font-bold transition-all active:scale-95 shadow-lg shadow-primary/20"
                                    >
                                        +
                                    </button>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max={maxLines}
                                    step="1"
                                    value={lines} 
                                    onChange={(e) => setLines(Number(e.target.value))}
                                    className="w-full max-w-md h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                                    style={{ backgroundImage: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(Number(lines)/maxLines)*100}%, var(--muted) ${(Number(lines)/maxLines)*100}%, var(--muted) 100%)` }}
                                />
                            </div>

                            {/* Customer Segment */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Customer Type</h3>
                                    <div className="h-px bg-border flex-grow"></div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[CustomerType.STANDARD, CustomerType.MILITARY_FR, CustomerType.PLUS_55].map(type => (
                                        <SegmentCard 
                                            key={type}
                                            type={type}
                                            isSelected={customerType === type}
                                            onClick={() => setCustomerType(type)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Plans */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Select Plan</h3>
                                    <div className="h-px bg-border flex-grow"></div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {availablePlans.map(plan => {
                                        const tempConfig = { ...createInitialConfig(planPricing), plan: plan.id, lines: Number(lines), customerType, discounts: { autopay: addAutopay, insider: false, thirdLineFree: true } };
                                        const t = calculateQuoteTotals(tempConfig, planPricing, servicePlans, discountSettings, [], [], deviceDatabase);
                                        return (
                                            <PlanCard 
                                                key={plan.id}
                                                plan={plan}
                                                lines={Number(lines)}
                                                totalPrice={t ? t.totalMonthlyInCents/100 : 0}
                                                isSelected={selectedPlanId === plan.id} 
                                                onClick={() => setSelectedPlanId(plan.id)} 
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: PHONES VISUAL CONFIGURATOR */}
            {step === 2 && (
                <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in-down bg-muted/20">
                    
                    {/* 1. TOP BAR: Global Config & Mode Switcher */}
                    <div className="px-6 py-4 bg-background border-b border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shrink-0">
                        {/* Allocation Pill */}
                        <div className="flex items-center bg-muted rounded-full p-1 self-start md:self-auto">
                            <div className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Allocation:
                            </div>
                            <div className="flex items-center gap-2 pr-2">
                                <span className={`text-xs font-bold transition-colors ${newPhoneCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{newPhoneCount} New</span>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={lines} 
                                    value={newPhoneCount}
                                    onChange={(e) => setNewPhoneCount(Number(e.target.value))}
                                    className="w-24 h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-primary"
                                />
                                <span className={`text-xs font-bold transition-colors ${lines - newPhoneCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{lines - newPhoneCount} BYOD</span>
                            </div>
                        </div>

                        {/* Mode Switcher */}
                        {Number(newPhoneCount) > 1 && (
                            <div className="flex bg-muted/50 p-1 rounded-xl">
                                <button 
                                    onClick={() => setDeviceSelectionMode('unified')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${deviceSelectionMode === 'unified' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Unified
                                </button>
                                <button 
                                    onClick={() => setDeviceSelectionMode('mixed')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${deviceSelectionMode === 'mixed' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Mix & Match
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 2. THE DECK: Visual Line Representation */}
                    <div className="bg-muted/30 border-b border-border py-6 px-6 overflow-x-auto shrink-0 min-h-[140px] flex items-center">
                        <div className="mx-auto max-w-5xl w-full">
                            {Number(newPhoneCount) === 0 ? (
                                <div className="text-center text-muted-foreground">
                                    <p className="text-sm">All lines are BYOD (Bring Your Own Device).</p>
                                    <p className="text-xs mt-1">Proceed to next step or adjust allocation above.</p>
                                </div>
                            ) : deviceSelectionMode === 'unified' ? (
                                // UNIFIED STACK
                                <div className="flex justify-center">
                                    <div className="relative w-64 h-24 bg-card rounded-2xl border-2 border-primary shadow-lg flex items-center p-4 gap-4 transition-all">
                                        {/* Multiplier Badge */}
                                        <div className="absolute -top-3 -right-3 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md z-20 border-2 border-white dark:border-slate-900">
                                            x{newPhoneCount}
                                        </div>
                                        
                                        {/* Stack Effect */}
                                        <div className="absolute inset-0 bg-card rounded-2xl border border-border shadow-sm translate-x-2 translate-y-2 -z-10"></div>
                                        <div className="absolute inset-0 bg-card rounded-2xl border border-border shadow-sm translate-x-4 translate-y-4 -z-20"></div>

                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl text-primary">
                                            {deviceDatabase.devices.find(d => d.id === selectedModelId)?.manufacturer === 'Apple' ? '' : deviceDatabase.devices.find(d => d.id === selectedModelId)?.manufacturer[0] || '📱'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">All New Lines</p>
                                            <p className="text-sm font-bold text-foreground truncate w-32">{deviceDatabase.devices.find(d => d.id === selectedModelId)?.name || 'Select Device'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // MIXED CAROUSEL
                                <div className="flex gap-4 px-4 pb-2">
                                    {individualSelections.map((modelId, index) => {
                                        const model = deviceDatabase.devices.find(d => d.id === modelId);
                                        const isActive = activeSlotIndex === index;
                                        return (
                                            <button 
                                                key={index}
                                                onClick={() => setActiveSlotIndex(index)}
                                                className={`
                                                    relative shrink-0 w-48 h-20 rounded-xl border-2 transition-all duration-300 flex items-center p-3 gap-3 text-left
                                                    ${isActive 
                                                        ? 'border-primary bg-background shadow-lg scale-105 z-10' 
                                                        : 'border-border bg-card/60 hover:bg-card hover:border-primary/30'
                                                    }
                                                `}
                                            >
                                                {isActive && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">EDITING</div>}
                                                
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    {model ? (model.manufacturer === 'Apple' ? '' : model.manufacturer[0]) : '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>Line {index + 1}</p>
                                                    <p className="text-xs font-bold text-foreground truncate">{model ? model.name : 'Select Device'}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. CATALOG & TRADE-IN */}
                    <div className="flex-1 overflow-y-auto pb-32 px-4 sm:px-6">
                        <div className="max-w-5xl mx-auto py-6">
                            
                            {/* Updated Trade-In Control Bar */}
                            {Number(newPhoneCount) > 0 && (
                                <div className="sticky top-0 z-20 mb-6 -mx-2 px-2 pb-2 bg-gradient-to-b from-muted/20 to-transparent">
                                    <div className="bg-card/90 backdrop-blur-md border border-border shadow-sm rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-4">
                                        
                                        {/* Label Area */}
                                        <div className="flex items-center gap-3 min-w-[140px]">
                                            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Trade-In For</span>
                                                <span className="text-sm font-bold text-foreground block">
                                                    {deviceSelectionMode === 'unified' ? 'All New Lines' : `Line ${activeSlotIndex + 1}`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mode Selector */}
                                        <div className="flex p-1 bg-muted rounded-lg shrink-0">
                                            {['none', 'manual', 'promo'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => handleTradeInChange('type', type as any)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${currentTradeInState.type === type ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {type === 'none' ? 'No Trade' : type === 'manual' ? 'Manual Credit' : 'Promotion'}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Contextual Input */}
                                        <div className="flex-1 flex items-center justify-end">
                                            {currentTradeInState.type === 'manual' && (
                                                <div className="relative w-full md:w-32 animate-fade-in-down">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-full h-9 pl-6 pr-3 rounded-lg border border-border bg-background text-sm font-bold focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                                        placeholder="Value"
                                                        value={currentTradeInState.value || ''}
                                                        onChange={(e) => handleTradeInChange('value', Number(e.target.value))}
                                                    />
                                                </div>
                                            )}

                                            {currentTradeInState.type === 'promo' && (
                                                <div className="relative w-full animate-fade-in-down">
                                                    <select 
                                                        className="w-full h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none truncate"
                                                        value={currentTradeInState.promoId || ''}
                                                        onChange={(e) => handleTradeInChange('promoId', e.target.value)}
                                                    >
                                                        <option value="" disabled>Select Offer...</option>
                                                        {availableDevicePromos.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Device Grid -> Device List Style */}
                            {Number(newPhoneCount) > 0 && (
                                <div className="flex flex-col gap-3">
                                    {phoneOptions.map(device => {
                                        const currentSelectedId = deviceSelectionMode === 'unified' ? selectedModelId : individualSelections[activeSlotIndex];
                                        return (
                                            <VisualDeviceCard
                                                key={device.id}
                                                device={device}
                                                isSelected={currentSelectedId === device.id}
                                                onClick={() => {
                                                    if (deviceSelectionMode === 'unified') {
                                                        setSelectedModelId(device.id);
                                                        setIndividualSelections(new Array(Number(newPhoneCount)).fill(device.id));
                                                    } else {
                                                        const newArr = [...individualSelections];
                                                        newArr[activeSlotIndex] = device.id;
                                                        setIndividualSelections(newArr);
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: CONNECTED DEVICES (BTS) - Redesigned */}
            {step === 3 && (
                <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in-down bg-muted/20">
                    {/* Header Context */}
                    <div className="bg-background border-b border-border shadow-sm sticky top-0 z-20">
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Connected Devices</h3>
                                <p className="text-sm text-muted-foreground">Enhance your plan with watches, tablets & trackers</p>
                            </div>
                            {totalBtsCount > 0 && (
                                <div className="bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300">{totalBtsCount} Added</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Category Tabs */}
                        <div className="px-6 pb-0 overflow-x-auto scrollbar-hide">
                            <div className="flex gap-6 border-b border-transparent">
                                {[
                                    { id: DeviceCategory.WATCH, label: 'Watches' },
                                    { id: DeviceCategory.TABLET, label: 'Tablets' },
                                    { id: DeviceCategory.TRACKER, label: 'Trackers' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setBtsCategory(tab.id)}
                                        className={`pb-3 text-sm font-bold transition-all border-b-2 ${btsCategory === tab.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-32 px-4 sm:px-6">
                        <div className="max-w-3xl mx-auto py-6 space-y-6">
                            {/* Device List */}
                            <div className="flex flex-col gap-3">
                                {btsOptions.map(device => (
                                    <BtsCard
                                        key={device.id}
                                        device={device}
                                        count={btsCounts[device.id] || 0}
                                        onIncrement={() => handleBtsCountChange(device.id, 1)}
                                        onDecrement={() => handleBtsCountChange(device.id, -1)}
                                        servicePlans={servicePlans}
                                        promotions={promotions}
                                        config={liveConfig}
                                    />
                                ))}
                                {btsOptions.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No devices found in this category.
                                    </div>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3 items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-1">Bundle & Save</p>
                                    <p className="text-xs text-blue-600/80 dark:text-blue-300/80 leading-relaxed">
                                        Adding a connected device often qualifies you for special service pricing (like $5/mo Watch plans) and device promotions!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 4: FINAL TOUCHES (Redesigned) */}
            {step === 4 && liveTotals && (
                <div className="flex-1 flex flex-col md:flex-row gap-6 px-4 sm:px-6 py-4 pb-40 animate-fade-in-down max-w-5xl mx-auto w-full">
                    
                    {/* Left Column: Configuration Options */}
                    <div className="flex-1 space-y-6">
                        
                        {/* Section: Monthly Recurring Add-ons */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Monthly Add-ons</h3>
                                <div className="h-px bg-border flex-grow"></div>
                            </div>
                            
                            {/* P360 Protection Card - Large Horizontal */}
                            <div 
                                onClick={() => setAddP360(!addP360)}
                                className={`cursor-pointer group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 shadow-sm ${addP360 ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-border bg-card hover:border-green-500/30 hover:bg-muted/30'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${addP360 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground">Device Protection</h4>
                                        <p className="text-xs text-muted-foreground">P360 • AppleCare+ • JUMP!</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold text-sm ${addP360 ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>+${(18 * Number(newPhoneCount))}/mo</div>
                                    <div className={`mt-1 w-8 h-4 rounded-full border flex items-center px-0.5 transition-all ml-auto ${addP360 ? 'bg-green-500 border-green-500 justify-end' : 'bg-input border-transparent justify-start'}`}>
                                        <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Accessories Grid - Compact Selection */}
                            {Number(newPhoneCount) > 0 && (
                                <div className="grid grid-cols-3 gap-3">
                                    <button 
                                        onClick={() => setAccessoryTier('none')}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${accessoryTier === 'none' ? 'border-muted-foreground bg-muted text-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted/50'}`}
                                    >
                                        <span className="text-xs font-bold block">No Acc.</span>
                                    </button>
                                    <button 
                                        onClick={() => setAccessoryTier('essentials')}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${accessoryTier === 'essentials' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-border bg-card text-muted-foreground hover:border-purple-200'}`}
                                    >
                                        <span className="text-xs font-bold block">Essentials</span>
                                        <span className="text-[10px] opacity-80 block mt-0.5">Case + Screen</span>
                                    </button>
                                    <button 
                                        onClick={() => setAccessoryTier('complete')}
                                        className={`relative p-3 rounded-xl border-2 text-center transition-all ${accessoryTier === 'complete' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : 'border-border bg-card text-muted-foreground hover:border-orange-200'}`}
                                    >
                                        {accessoryTier === 'complete' && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">BEST</span>}
                                        <span className="text-xs font-bold block">Complete</span>
                                        <span className="text-[10px] opacity-80 block mt-0.5">Bundle All</span>
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Section: One-Time & Discounts */}
                        <section className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Fees & Discounts</h3>
                                <div className="h-px bg-border flex-grow"></div>
                            </div>

                            <div className="space-y-3">
                                {/* Activation Fee Toggle Row */}
                                <div 
                                    onClick={() => setIncludeActivation(!includeActivation)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${includeActivation ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-border border-dashed bg-card opacity-70 hover:opacity-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-md ${includeActivation ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </div>
                                        <div>
                                            <span className={`text-sm font-bold block ${includeActivation ? 'text-blue-900 dark:text-blue-200' : 'text-muted-foreground line-through'}`}>Activation Fees</span>
                                            <span className="text-[10px] text-muted-foreground block">One-time charge on first bill</span>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${includeActivation ? 'bg-blue-500 justify-end' : 'bg-input justify-start'}`}>
                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                    </div>
                                </div>

                                {/* Insider Toggle Row (Conditional) */}
                                {currentPlanDetails?.allowedDiscounts?.insider && (
                                    <div 
                                        onClick={() => setAddInsider(!addInsider)}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${addInsider ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-900/10' : 'border-border bg-card hover:border-pink-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-md ${addInsider ? 'bg-pink-100 text-pink-600' : 'bg-muted text-muted-foreground'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                                            </div>
                                            <div>
                                                <span className={`text-sm font-bold block ${addInsider ? 'text-pink-900 dark:text-pink-200' : 'text-foreground'}`}>Insider Discount</span>
                                                <span className="text-[10px] text-muted-foreground block">20% off eligible voice lines</span>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${addInsider ? 'bg-pink-500 justify-end' : 'bg-input justify-start'}`}>
                                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                )}

                                {/* 3rd Line Free Toggle */}
                                {Number(lines) >= 3 && currentPlanDetails?.allowedDiscounts?.thirdLineFree && (
                                    <div 
                                        onClick={() => setAddThirdLineFree(!addThirdLineFree)}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${addThirdLineFree ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10' : 'border-border bg-card hover:border-purple-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-md ${addThirdLineFree ? 'bg-purple-100 text-purple-600' : 'bg-muted text-muted-foreground'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                                            </div>
                                            <div>
                                                <span className={`text-sm font-bold block ${addThirdLineFree ? 'text-purple-900 dark:text-purple-200' : 'text-foreground'}`}>3rd Line Free</span>
                                                <span className="text-[10px] text-muted-foreground block">Monthly bill credit</span>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${addThirdLineFree ? 'bg-purple-500 justify-end' : 'bg-input justify-start'}`}>
                                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Advanced Financing */}
                        <div className="pt-2">
                            <button 
                                onClick={() => setShowAdvancedFinancing(!showAdvancedFinancing)}
                                className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <span>{showAdvancedFinancing ? 'Hide' : 'Show'} Advanced Financing</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${showAdvancedFinancing ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            
                            {showAdvancedFinancing && (
                                <div className="bg-muted/30 p-3 rounded-xl border border-border mt-2 animate-fade-in-down">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input label="Account Max" name="maxEC" type="number" value={maxEC} onChange={e => setMaxEC(Number(e.target.value))} prefix="$" />
                                        <Input label="Per Line Cap" name="perLineEC" type="number" value={perLineEC} onChange={e => setPerLineEC(Number(e.target.value))} prefix="$" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Summary (Desktop Only, Visual) */}
                    <div className="md:w-80 lg:w-96 flex-shrink-0 hidden md:block">
                        <div className="sticky top-32 space-y-4">
                            {/* Live Receipt */}
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 rounded-2xl shadow-xl transform transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Est. Monthly</p>
                                        <p className="text-3xl font-extrabold tracking-tight">
                                            ${(liveTotals.totalMonthlyInCents/100).toFixed(0)}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 cursor-help" title="Includes device taxes and down payments">
                                            <span>+ ${(liveTotals.dueTodayInCents/100).toFixed(0)} Due Today</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-white/10 backdrop-blur-md rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90">
                                            Live Quote
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-xs text-gray-300 border-t border-white/10 pt-3">
                                    <div className="flex justify-between">
                                        <span>Plan ({lines} Lines)</span>
                                        <span>${(liveTotals.finalPlanPriceInCents/100).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Equipment</span>
                                        <span>${(liveTotals.monthlyDevicePaymentInCents/100).toFixed(0)}</span>
                                    </div>
                                    {liveTotals.insuranceCostInCents > 0 && (
                                        <div className="flex justify-between text-green-400 font-medium">
                                            <span>Protection</span>
                                            <span>+${(liveTotals.insuranceCostInCents/100).toFixed(0)}</span>
                                        </div>
                                    )}
                                    {liveTotals.financedAccessoriesMonthlyCostInCents > 0 && (
                                        <div className="flex justify-between text-purple-400 font-medium">
                                            <span>Accessories</span>
                                            <span>+${(liveTotals.financedAccessoriesMonthlyCostInCents/100).toFixed(0)}</span>
                                        </div>
                                    )}
                                    {liveTotals.monthlyServicePlanCostInCents > 0 && (
                                        <div className="flex justify-between text-indigo-400 font-medium">
                                            <span>Connected Devices</span>
                                            <span>+${(liveTotals.monthlyServicePlanCostInCents/100).toFixed(0)}</span>
                                        </div>
                                    )}
                                    {liveTotals.insiderDiscountInCents > 0 && (
                                        <div className="flex justify-between text-pink-400 font-medium">
                                            <span>Insider Savings</span>
                                            <span>-${(liveTotals.insiderDiscountInCents/100).toFixed(0)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Action Bar (Unified for Mobile & Desktop) */}
            <WizardActionBar 
                step={step} 
                totalSteps={4} 
                onBack={() => Number(step) === 1 ? handleExit() : setStep(step - 1)}
                onNext={() => {
                    if (Number(step) === 1) {
                        const linesNum = Number(lines);
                        const phonesNum = Number(newPhoneCount);
                        if (phonesNum > linesNum) setNewPhoneCount(linesNum);
                        setStep(2);
                    } else {
                        setStep(step + 1);
                    }
                }}
                onFinish={handleFinish}
                canGoNext={canGoNext}
                totalMonthly={liveTotals ? liveTotals.totalMonthlyInCents/100 : undefined}
            />
        </div>
    );
};

export default QuoteWizard;
