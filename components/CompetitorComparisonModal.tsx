
import React, { useState, useMemo } from 'react';
import { QuoteConfig, CalculatedTotals } from '../types';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import { Card } from './ui/Card';

interface CompetitorComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentQuote: CalculatedTotals | null;
    config: QuoteConfig;
}

const CompetitorComparisonModal: React.FC<CompetitorComparisonModalProps> = ({ isOpen, onClose, currentQuote, config }) => {
    const [competitorName, setCompetitorName] = useState('Verizon');
    const [currentBill, setCurrentBill] = useState(200); // Default placeholder
    const [devicePayoff, setDevicePayoff] = useState(0);

    const tmobileMonthly = currentQuote ? currentQuote.totalMonthlyInCents / 100 : 0;
    const monthlySavings = Math.max(0, currentBill - tmobileMonthly);
    const twoYearSavings = (monthlySavings * 24) + devicePayoff;

    // Chart Heights (Max 160px)
    const maxVal = Math.max(currentBill, tmobileMonthly);
    const compHeight = (currentBill / maxVal) * 160;
    const tmoHeight = (tmobileMonthly / maxVal) * 160;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Value Comparison</h2>
                        <p className="text-sm text-muted-foreground">Compare vs. {competitorName}</p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-bold text-sm">
                        ${twoYearSavings.toLocaleString()} 2-Year Savings
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Inputs Side */}
                    <div className="space-y-5">
                        <div className="p-4 bg-muted/30 rounded-xl border border-border">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Current Provider</h3>
                            <div className="space-y-4">
                                <Select 
                                    name="competitor" 
                                    label="Carrier" 
                                    value={competitorName} 
                                    onChange={(_, val) => setCompetitorName(val)}
                                    options={[
                                        { value: 'Verizon', label: 'Verizon' },
                                        { value: 'AT&T', label: 'AT&T' },
                                        { value: 'Other', label: 'Other' }
                                    ]} 
                                />
                                <Input 
                                    label="Current Monthly Bill" 
                                    name="currentBill" 
                                    type="number" 
                                    prefix="$" 
                                    value={currentBill} 
                                    onChange={e => setCurrentBill(Number(e.target.value))} 
                                />
                                <div className="pt-2 border-t border-border/50">
                                    <Input 
                                        label="Device Payoff Needed?" 
                                        name="payoff" 
                                        type="number" 
                                        prefix="$" 
                                        value={devicePayoff} 
                                        onChange={e => setDevicePayoff(Number(e.target.value))} 
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        We can pay off up to $800/line via Carrier Freedom or Keep & Switch.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Side */}
                    <div className="flex flex-col justify-end">
                        <div className="flex items-end justify-center gap-6 mb-6 h-48">
                            {/* Competitor Bar */}
                            <div className="flex flex-col items-center gap-2 group">
                                <span className="font-bold text-muted-foreground">${currentBill}</span>
                                <div 
                                    className="w-16 bg-gray-400 rounded-t-lg relative group-hover:bg-gray-500 transition-colors"
                                    style={{ height: `${compHeight}px` }}
                                ></div>
                                <span className="text-xs font-bold text-muted-foreground uppercase">{competitorName}</span>
                            </div>

                            {/* T-Mobile Bar */}
                            <div className="flex flex-col items-center gap-2 group">
                                <span className="font-bold text-primary">${tmobileMonthly.toFixed(0)}</span>
                                <div 
                                    className="w-16 bg-primary rounded-t-lg relative shadow-[0_0_20px_rgba(226,0,116,0.4)]"
                                    style={{ height: `${tmoHeight}px` }}
                                >
                                    {/* Savings Indicator */}
                                    {monthlySavings > 0 && (
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm whitespace-nowrap animate-bounce">
                                            Save ${monthlySavings.toFixed(0)}/mo
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-primary uppercase">T-Mobile</span>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                                <span className="text-muted-foreground">Monthly Savings</span>
                                <span className="font-bold text-green-600 dark:text-green-400">${monthlySavings.toFixed(0)}</span>
                            </div>
                            {devicePayoff > 0 && (
                                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                                    <span className="text-muted-foreground">Device Reimbursement</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">${devicePayoff}</span>
                                </div>
                            )}
                            <div className="flex justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 mt-2">
                                <span className="font-bold text-primary">Total 2-Year Value</span>
                                <span className="font-black text-primary text-lg">${twoYearSavings.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-muted hover:bg-muted/80 font-semibold text-sm transition-colors"
                    >
                        Close Comparison
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CompetitorComparisonModal;
