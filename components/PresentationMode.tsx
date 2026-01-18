
import React from 'react';
import { QuoteConfig, CalculatedTotals } from '../types';
import Button from './ui/Button';

interface PresentationModeProps {
    config: QuoteConfig;
    totals: CalculatedTotals | null;
    onClose: () => void;
}

const PresentationMode: React.FC<PresentationModeProps> = ({ config, totals, onClose }) => {
    if (!totals) return null;

    const formatMoney = (cents: number) => {
        return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    const isPremium = totals.planName.toLowerCase().includes('beyond') || totals.planName.toLowerCase().includes('plus');

    return (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-fade-in-down overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <span className="font-bold text-lg">T</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Your Quote</h1>
                </div>
                <Button onClick={onClose} variant="secondary" className="rounded-full px-6 shadow-sm">
                    Exit Presentation
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-12 flex flex-col justify-center">
                
                {/* Greeting */}
                {config.customerName && (
                    <div className="mb-10 text-center animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                            Ready for you, <span className="text-primary">{config.customerName}</span>.
                        </h2>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
                    
                    {/* Monthly Card */}
                    <div className="relative group animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-[2.5rem] blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-100"></div>
                        <div className="relative bg-card border border-border/50 rounded-[2.5rem] p-8 sm:p-10 h-full flex flex-col shadow-2xl transition-transform duration-300 group-hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">Monthly</h3>
                            </div>

                            <div className="mb-8 border-b border-border/50 pb-8">
                                <div className="flex items-baseline">
                                    <span className="text-6xl sm:text-8xl font-black text-foreground tracking-tighter">
                                        {formatMoney(totals.totalMonthlyInCents)}
                                    </span>
                                    <span className="text-2xl text-muted-foreground font-medium ml-2">/mo</span>
                                </div>
                                {config.discounts.autopay && (
                                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        AutoPay Included
                                    </div>
                                )}
                            </div>

                            <div className="space-y-5 flex-1">
                                <Row label={`${config.lines} Voice Lines`} subLabel={totals.planName} value={formatMoney(totals.finalPlanPriceInCents)} />
                                {totals.monthlyDevicePaymentInCents > 0 && (
                                    <Row label="Equipment Financing" value={formatMoney(totals.monthlyDevicePaymentInCents)} />
                                )}
                                {totals.insuranceCostInCents > 0 && (
                                    <Row label="Protection 360" value={formatMoney(totals.insuranceCostInCents)} />
                                )}
                                {totals.monthlyServicePlanCostInCents > 0 && (
                                    <Row label="Connected Devices" value={formatMoney(totals.monthlyServicePlanCostInCents)} />
                                )}
                            </div>
                            
                            {totals.totalDiscountsInCents > 0 && (
                                <div className="mt-8 pt-6 border-t border-border/50">
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Monthly Savings</p>
                                    <p className="text-3xl font-black text-green-600 dark:text-green-500">
                                        {formatMoney(totals.totalDiscountsInCents)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Today Card */}
                    <div className="relative group animate-fade-in-down" style={{ animationDelay: '0.3s' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-[2.5rem] blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-100"></div>
                        <div className="relative bg-card border border-border/50 rounded-[2.5rem] p-8 sm:p-10 h-full flex flex-col shadow-2xl transition-transform duration-300 group-hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">Due Today</h3>
                            </div>

                            <div className="mb-8 border-b border-border/50 pb-8">
                                <div className="flex items-baseline">
                                    <span className="text-6xl sm:text-8xl font-black text-foreground tracking-tighter">
                                        {formatMoney(totals.dueTodayInCents)}
                                    </span>
                                    <span className="text-2xl text-muted-foreground font-medium ml-2">today</span>
                                </div>
                            </div>

                            <div className="space-y-5 flex-1">
                                <Row label="Taxes on Devices" value={formatMoney(totals.dueTodayDeviceTaxInCents)} />
                                {totals.totalOneTimeFeesInCents > 0 ? (
                                    <Row label="Activation Fees" value={formatMoney(totals.totalOneTimeFeesInCents)} />
                                ) : (
                                    <Row label="Activation Fees" value="$0.00" highlight="Waived" />
                                )}
                                {(totals.optionalDownPaymentInCents + totals.requiredDownPaymentInCents) > 0 && (
                                    <Row label="Device Down Payments" value={formatMoney(totals.optionalDownPaymentInCents + totals.requiredDownPaymentInCents)} />
                                )}
                                {totals.paidInFullAccessoriesCostInCents > 0 && (
                                    <Row label="Accessories" value={formatMoney(totals.paidInFullAccessoriesCostInCents)} />
                                )}
                            </div>

                            {(totals.lumpSumTradeInInCents + totals.instantDeviceRebateInCents) > 0 && (
                                <div className="mt-8 pt-6 border-t border-border/50">
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Instant Credit Applied</p>
                                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                        -{formatMoney(totals.lumpSumTradeInInCents + totals.instantDeviceRebateInCents)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Value Props / Perks */}
                {isPremium && (
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-down" style={{ animationDelay: '0.4s' }}>
                        <Perk icon="📺" label="Netflix Included" sub="Standard with Ads" />
                        <Perk icon="🍎" label="Apple TV+ Included" sub="On Us" />
                        <Perk icon="✈️" label="In-Flight Wi-Fi" sub="Unlimited" />
                        <Perk icon="🌍" label="Intl. Data" sub="5GB High-Speed" />
                    </div>
                )}
            </div>
        </div>
    );
};

const Row: React.FC<{ label: string; subLabel?: string; value: string; highlight?: string }> = ({ label, subLabel, value, highlight }) => (
    <div className="flex justify-between items-start text-lg">
        <div>
            <span className="text-muted-foreground font-medium block">{label}</span>
            {subLabel && <span className="text-xs text-muted-foreground/70 block mt-0.5">{subLabel}</span>}
        </div>
        <div className="flex items-center gap-2">
            {highlight && <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-md">{highlight}</span>}
            <span className="font-bold text-foreground">{value}</span>
        </div>
    </div>
);

const Perk: React.FC<{ icon: string; label: string; sub: string }> = ({ icon, label, sub }) => (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
        <div className="text-3xl">{icon}</div>
        <div>
            <p className="font-bold text-foreground leading-tight">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
    </div>
);

export default PresentationMode;
