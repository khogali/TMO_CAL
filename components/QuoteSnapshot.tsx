import React, { useState } from 'react';
import { QuoteConfig, CalculatedTotals, GuidancePlacement } from '../types';
import { useAuth, useData } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import GuidanceDisplay from './ui/GuidanceDisplay';

interface QuoteSnapshotProps {
  mode: 'simple' | 'full';
  config: QuoteConfig;
  totals: CalculatedTotals | null;
  onSave?: () => void;
  onSaveTemplate?: () => void;
}

const formatCurrency = (amountInCents: number) => {
    return (amountInCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const DetailRow: React.FC<{ label: string; value: string; isSubtle?: boolean; isCredit?: boolean; isTotal?: boolean; }> = ({ label, value, isSubtle, isCredit, isTotal }) => {
    let labelClass = 'text-sm text-foreground';
    let valueClass = 'text-sm font-semibold text-foreground';

    if (isSubtle) {
        labelClass = 'text-sm text-muted-foreground';
        valueClass = 'text-sm font-medium text-foreground';
    }
    if (isCredit) {
        valueClass = 'text-sm font-semibold text-green-600 dark:text-green-500';
    }
    if (isTotal) {
        labelClass = 'text-base font-bold text-foreground';
        valueClass = 'text-base font-extrabold text-foreground';
    }

    return (
        <div className={`flex justify-between items-baseline py-2 ${isTotal ? 'mt-3 pt-3 border-t-2 border-dashed border-border' : ''}`}>
            <p className={labelClass}>{label}</p>
            {!isTotal && <div className="flex-1 border-b border-dotted border-border/40 mx-2"></div>}
            <p className={`text-right ${valueClass}`}>{value}</p>
        </div>
    );
};

const QuoteSnapshot: React.FC<QuoteSnapshotProps> = ({ mode, config, totals, onSave, onSaveTemplate }) => {
  const { userProfile } = useAuth();
  const { guidanceItems } = useData();
  const [copied, setCopied] = useState(false);
  const [isMonthlyCreditsExpanded, setMonthlyCreditsExpanded] = useState(false);
  const [isDueTodayCreditsExpanded, setDueTodayCreditsExpanded] = useState(false);

  const handleCopy = () => {
    if (!totals || !config) return;
    const summaryText = `
*T-Mobile Quote Summary ${config.customerName ? `for ${config.customerName}` : ''}*
*Est. Monthly Total: ${formatCurrency(totals.totalMonthlyInCents)}*
*Est. Due Today: ${formatCurrency(totals.dueTodayInCents)}*
---
*MONTHLY BREAKDOWN*
Plan & Add-ons: ${formatCurrency(totals.basePlanPriceInCents + totals.insuranceCostInCents + totals.monthlyDevicePaymentInCents + totals.financedAccessoriesMonthlyCostInCents + totals.monthlyServicePlanCostInCents)}
Discounts & Credits: -${formatCurrency(totals.autopayDiscountInCents + totals.insiderDiscountInCents + totals.thirdLineFreeDiscountInCents + totals.promotionDiscountInCents + totals.monthlyTradeInCreditInCents + totals.monthlyDevicePromoCreditInCents + totals.monthlyServicePlanPromoCreditInCents)}
Taxes & Fees: ${totals.taxesIncluded ? "Included" : formatCurrency(totals.calculatedTaxesInCents)}
---
*DUE TODAY BREAKDOWN*
One-time Fees & Down Payments: ${formatCurrency(totals.totalOneTimeFeesInCents + totals.optionalDownPaymentInCents + totals.requiredDownPaymentInCents + totals.paidInFullAccessoriesCostInCents)}
Upfront Credits: -${formatCurrency(totals.lumpSumTradeInInCents + totals.instantDeviceRebateInCents)}
Taxes: ${formatCurrency(totals.dueTodayDeviceTaxInCents + totals.dueTodayFeesTaxInCents + totals.paidInFullAccessoriesTaxInCents + totals.financedAccessoriesTaxInCents)}
${(mode === 'full' && userProfile?.displayName) ? `
---
*PREPARED BY*
${userProfile.displayName}
${userProfile.phoneNumber || ''}
` : ''}
    `.trim().replace(/^\s+/gm, '');

    navigator.clipboard.writeText(summaryText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!totals) {
    return (
      <Card><CardContent><div className="text-center py-12"><p className="text-muted-foreground">Calculating your quote...</p></div></CardContent></Card>
    );
  }

  const { totalMonthlyInCents, dueTodayInCents, basePlanPriceInCents, autopayDiscountInCents, insiderDiscountInCents, thirdLineFreeDiscountInCents, insuranceCostInCents, monthlyDevicePaymentInCents, financedAccessoriesMonthlyCostInCents, monthlyTradeInCreditInCents, taxesIncluded, activationFeeInCents, paidInFullAccessoriesCostInCents, dueTodayDeviceTaxInCents, dueTodayFeesTaxInCents, paidInFullAccessoriesTaxInCents, financedAccessoriesTaxInCents, lumpSumTradeInInCents, optionalDownPaymentInCents, requiredDownPaymentInCents, appliedPromotions, monthlyDevicePromoCreditInCents, instantDeviceRebateInCents, monthlyServicePlanCostInCents, monthlyServicePlanPromoCreditInCents } = totals;
  const totalMonthlyTaxes = taxesIncluded ? 0 : totals.calculatedTaxesInCents;
  const totalDueTodayTaxes = dueTodayDeviceTaxInCents + dueTodayFeesTaxInCents + paidInFullAccessoriesTaxInCents + financedAccessoriesTaxInCents;
  const totalDownPayments = optionalDownPaymentInCents + requiredDownPaymentInCents;
  
  const monthlySubtotal = basePlanPriceInCents + insuranceCostInCents + monthlyDevicePaymentInCents + monthlyServicePlanCostInCents + financedAccessoriesMonthlyCostInCents;
  const totalMonthlyCredits = autopayDiscountInCents + insiderDiscountInCents + thirdLineFreeDiscountInCents + appliedPromotions.reduce((sum, p) => sum + p.discountInCents, 0) + monthlyTradeInCreditInCents + monthlyDevicePromoCreditInCents + monthlyServicePlanPromoCreditInCents;
  
  const dueTodaySubtotal = activationFeeInCents + totalDownPayments + paidInFullAccessoriesCostInCents;
  const totalDueTodayCredits = lumpSumTradeInInCents + instantDeviceRebateInCents;

  const hasMonthlyCredits = totalMonthlyCredits > 0;
  const hasDueTodayCredits = totalDueTodayCredits > 0;

  return (
    <>
    <GuidanceDisplay items={guidanceItems} config={config} placement={GuidancePlacement.BEFORE_SNAPSHOT} />
    <Card className="overflow-hidden bg-muted/30 border-muted">
        <CardHeader>
            <CardTitle>{mode === 'simple' ? 'Quote Summary' : `Quote for ${config.customerName || '...'}`}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 border-t border-border/60 pt-3">
              <span>{totals.planName}</span>
              <span className="text-border">|</span>
              <span>{config.lines} Line{config.lines > 1 ? 's' : ''}</span>
              {config.devices.length > 0 && <><span className="text-border">|</span><span>{config.devices.length} Device{config.devices.length > 1 ? 's' : ''}</span></>}
            </div>
        </CardHeader>
        <CardContent className="space-y-6 !pt-0">
            {/* Top Level Stats */}
            <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-primary text-primary-foreground text-center relative overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                    <p className="text-sm font-semibold text-primary-foreground/90 mb-1 relative z-10">Est. Monthly</p>
                    <p className="text-3xl lg:text-4xl font-extrabold tracking-tight relative z-10">{formatCurrency(totalMonthlyInCents)}</p>
                </div>
                 <div className="p-4 rounded-2xl bg-card border-2 border-dashed border-border text-center shadow-sm">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Est. Due Today</p>
                    <p className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">{formatCurrency(dueTodayInCents)}</p>
                </div>
            </div>
            
            <div className="space-y-4">
              {/* Monthly Breakdown */}
              <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
                <h4 className="font-bold text-foreground flex items-center gap-2 text-base">
                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" /></svg>
                    </div>
                    Monthly Breakdown
                </h4>
                <div className="mt-4 space-y-1">
                    <DetailRow label="Plan & Add-ons Subtotal" value={formatCurrency(monthlySubtotal)} />
                    {hasMonthlyCredits && (
                        <>
                            <div className="flex justify-between items-baseline py-2 cursor-pointer group select-none" onClick={() => setMonthlyCreditsExpanded(!isMonthlyCreditsExpanded)}>
                                <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-500 font-semibold">
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${isMonthlyCreditsExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                    Discounts & Credits
                                </div>
                                <div className="flex-1 border-b border-dotted border-border/40 mx-2"></div>
                                <p className="text-sm text-right font-semibold text-green-600 dark:text-green-500">{`-${formatCurrency(totalMonthlyCredits)}`}</p>
                            </div>
                            <div className={`pl-6 overflow-hidden transition-all duration-300 ease-in-out ${isMonthlyCreditsExpanded ? 'max-h-96 opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                                {autopayDiscountInCents > 0 && <DetailRow isSubtle label="AutoPay Discount" value={`-${formatCurrency(autopayDiscountInCents)}`} />}
                                {insiderDiscountInCents > 0 && <DetailRow isSubtle label="Insider Discount" value={`-${formatCurrency(insiderDiscountInCents)}`} />}
                                {thirdLineFreeDiscountInCents > 0 && <DetailRow isSubtle label="3rd Line Free" value={`-${formatCurrency(thirdLineFreeDiscountInCents)}`} />}
                                {appliedPromotions.map(p => p.discountInCents > 0 && <DetailRow isSubtle key={p.id} label={p.name} value={`-${formatCurrency(p.discountInCents)}`} />)}
                                {monthlyTradeInCreditInCents > 0 && <DetailRow isSubtle label="Trade-in Credit" value={`-${formatCurrency(monthlyTradeInCreditInCents)}`} />}
                                {monthlyDevicePromoCreditInCents > 0 && <DetailRow isSubtle label="Device Promo Credit" value={`-${formatCurrency(monthlyDevicePromoCreditInCents)}`} />}
                                {monthlyServicePlanPromoCreditInCents > 0 && <DetailRow isSubtle label="Connected Device Promo" value={`-${formatCurrency(monthlyServicePlanPromoCreditInCents)}`} />}
                            </div>
                        </>
                    )}
                    <DetailRow label="Est. Taxes & Fees" value={taxesIncluded ? "Included" : formatCurrency(totalMonthlyTaxes)} />
                    <DetailRow isTotal label="Total Monthly" value={formatCurrency(totalMonthlyInCents)} />
                </div>
              </div>
              
              {/* Due Today Breakdown */}
              {dueTodayInCents > 0 && (
              <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
                <h4 className="font-bold text-foreground flex items-center gap-2 text-base">
                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.5 3.75h15a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25h-15a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25z" /></svg>
                    </div>
                    Due Today Breakdown
                </h4>
                 <div className="mt-4 space-y-1">
                    <DetailRow label="One-Time Fees & Down Payments" value={formatCurrency(dueTodaySubtotal)} />
                    {hasDueTodayCredits && (
                        <>
                           <div className="flex justify-between items-baseline py-2 cursor-pointer group select-none" onClick={() => setDueTodayCreditsExpanded(!isDueTodayCreditsExpanded)}>
                                <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-500 font-semibold">
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${isDueTodayCreditsExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                    Upfront Credits
                                </div>
                                <div className="flex-1 border-b border-dotted border-border/40 mx-2"></div>
                                <p className="text-sm text-right font-semibold text-green-600 dark:text-green-500">{`-${formatCurrency(totalDueTodayCredits)}`}</p>
                            </div>
                             <div className={`pl-6 overflow-hidden transition-all duration-300 ease-in-out ${isDueTodayCreditsExpanded ? 'max-h-96 opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                                {lumpSumTradeInInCents > 0 && <DetailRow isSubtle label="Upfront Trade-in" value={`-${formatCurrency(lumpSumTradeInInCents)}`} />}
                                {instantDeviceRebateInCents > 0 && <DetailRow isSubtle label="Instant Rebate" value={`-${formatCurrency(instantDeviceRebateInCents)}`} />}
                            </div>
                        </>
                    )}
                    <DetailRow label="Taxes" value={formatCurrency(totalDueTodayTaxes)} />
                    <DetailRow isTotal label="Total Due Today" value={formatCurrency(dueTodayInCents)} />
                 </div>
              </div>
              )}
            </div>
        </CardContent>
        <div className="p-4 border-t border-border bg-muted/50 space-y-4">
            {mode === 'full' && onSave && (
                <Button onClick={onSave} className="w-full shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    <span>Save Lead</span>
                </Button>
            )}
            <div className={`grid ${mode === 'full' && onSaveTemplate ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                {mode === 'full' && onSaveTemplate && (
                    <Button onClick={onSaveTemplate} variant="secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c.1.121.176.26.224.41l.033.111v14.733c0 .285-.112.559-.31.757l-.12.118a.998.998 0 01-1.414 0l-5.3-5.3-5.3 5.3a.998.998 0 01-1.414 0l-.12-.118a1.05 1.05 0 01-.31-.757V3.945c.048-.15.124-.289.224-.41l.033-.111C3.876 2.45 4.82 2 5.82 2h12.36c1 0 1.944.45 2.593 1.322z" /></svg>
                        Save Template
                    </Button>
                )}
                <Button 
                    variant={mode === 'full' ? 'secondary' : 'default'} 
                    size={mode === 'simple' ? 'sm' : 'default'}
                    onClick={handleCopy} 
                    className={mode === 'simple' ? 'w-full' : ''}
                >
                    {copied ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>}
                    <span className="ml-2">{copied ? 'Copied!' : 'Copy Summary'}</span>
                </Button>
            </div>
             {(mode === 'full' && userProfile?.displayName) && (
                <div className="text-center text-xs text-muted-foreground">
                    Prepared by {userProfile.displayName} {userProfile.phoneNumber && `• ${userProfile.phoneNumber}`}
                </div>
            )}
        </div>
    </Card>
    </>
  );
};

export default QuoteSnapshot;