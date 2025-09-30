
import React, { useState } from 'react';
import { SavedLead, PlanPricingData, DiscountSettings, CustomerType, InsurancePlan, TradeInType, AccessoryPaymentType } from '../types';
import { Card, CardContent, CardTitle, CardHeader } from './ui/Card';
import { calculateQuoteTotals } from '../utils/calculations';

const formatCurrency = (amountInCents: number) => {
    return (amountInCents / 100).toLocaleString(navigator.language, {
        style: 'currency',
        currency: 'USD'
    });
};

const getCustomerTypeLabel = (type: CustomerType) => {
    switch (type) {
        case CustomerType.STANDARD: return 'Standard Customer';
        case CustomerType.MILITARY_FR: return 'Military & FR';
        case CustomerType.PLUS_55: return '55+';
        default: return type;
    }
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode; isSubtle?: boolean; valueClassName?: string }> = ({ label, value, isSubtle = false, valueClassName = '' }) => (
  <div className={`flex justify-between items-start py-2 ${isSubtle ? 'pl-4' : ''}`}>
    <p className="text-sm text-muted-foreground flex-shrink-0 mr-2">{label}</p>
    <p className={`font-medium text-sm text-foreground text-right ${valueClassName}`}>{value}</p>
  </div>
);

const LeadCard: React.FC<{ lead: SavedLead; planPricing: PlanPricingData; onLoad: (lead: SavedLead) => void; onDelete: (leadId: string) => void; discountSettings: DiscountSettings; insurancePlans: InsurancePlan[];}> = ({ lead, planPricing, onLoad, onDelete, discountSettings, insurancePlans }) => {
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const planDetails = planPricing[lead.plan];
    const totals = calculateQuoteTotals(lead, planPricing, discountSettings, insurancePlans);

    if (!planDetails || !totals) return null;

    const {
      totalMonthlyInCents,
      dueTodayInCents,
      basePlanPriceInCents,
      autopayDiscountInCents,
      insiderDiscountInCents,
      thirdLineFreeDiscountInCents,
      insuranceCostInCents,
      monthlyDevicePaymentInCents,
      financedAccessories,
      monthlyTradeInCreditInCents,
      calculatedTaxesInCents,
      activationFeeInCents,
      upgradeFeeInCents,
      paidInFullAccessories,
      dueTodayDeviceTaxInCents,
      dueTodayFeesTaxInCents,
      paidInFullAccessoriesTaxInCents,
      financedAccessoriesTaxInCents,
      lumpSumTradeInInCents
    } = totals;

    const appliedDiscounts = Object.entries(lead.discounts).filter(([, val]) => val).map(([key]) => {
        if (key === 'autopay') return 'AutoPay';
        if (key === 'insider') return 'Insider Code';
        if (key === 'thirdLineFree') return '3rd Line Free';
        return '';
    }).filter(Boolean);

    const insuranceDetails = lead.insuranceTier === 'none'
        ? { name: 'None' }
        : insurancePlans.find(p => p.id === lead.insuranceTier) || { name: 'N/A' };
    const insuranceLines = lead.insuranceLines ?? (lead.insuranceTier && lead.insuranceTier !== 'none' ? lead.lines : 0);

    const handleCopy = () => {
        const insuranceLabel = insuranceDetails.name;
        const insuranceText = insuranceLines > 0 ? `${insuranceLabel} (${insuranceLines} line${insuranceLines > 1 ? 's' : ''})` : 'None';

        const copyText = `
    *** T-Mobile Quote Summary for ${lead.customerName} ***
    
    --- CUSTOMER ---
    Name: ${lead.customerName || 'N/A'}
    Phone: ${lead.customerPhone || 'N/A'}
    
    --- QUOTE ---
    Customer Type: ${getCustomerTypeLabel(lead.customerType)}
    Plan: ${planDetails.name} for ${lead.lines} line(s)
    Insurance: ${insuranceText}

    --- FEES ---
    ${(lead.fees?.activation || lead.fees?.upgrade) ? 
        [
            lead.fees?.activation && 'Activation Fee ($10/line)',
            lead.fees?.upgrade && 'Upgrade Fee ($35/line)'
        ].filter(Boolean).join('\n')
        : 'No one-time fees'
    }
    
    --- DEVICES (${(lead.devices || []).length}) ---
    ${(lead.devices || []).length > 0 ? lead.devices.map((dev, i) => `Device ${i + 1}: ${formatCurrency(Math.round(dev.price * 100))} (Trade-in: ${formatCurrency(Math.round(dev.tradeIn * 100))} applied as ${dev.tradeInType === TradeInType.MONTHLY_CREDIT ? 'Monthly Credit' : 'Upfront Credit'})`).join('\n') : 'No devices'}
    
    --- ACCESSORIES (${(lead.accessories || []).length}) ---
    ${(lead.accessories || []).length > 0 ? lead.accessories.map((acc, i) => `Accessory ${i + 1}: ${acc.name || 'Unnamed'} (x${acc.quantity || 1}) - ${formatCurrency(Math.round(acc.price * 100))} (${acc.paymentType === AccessoryPaymentType.FINANCED ? 'Financed' : 'Paid in Full'})`).join('\n') : 'No accessories'}

    --- DISCOUNTS ---
    ${appliedDiscounts.length > 0 ? appliedDiscounts.join(', ') : 'None'}
    
    --- PRICING ---
    Total Monthly Estimate: ${formatCurrency(totalMonthlyInCents)}
    Amount Due Today: ${formatCurrency(dueTodayInCents)}
    
    --- PREPARED BY ---
    Ahmed Khogali
    215-954-2339
        `.trim().replace(/^\s+/gm, '');

        navigator.clipboard.writeText(copyText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    return (
        <Card>
            <CardHeader className="flex justify-between items-start">
                 <div className="flex-grow">
                    <CardTitle className="mb-1">{lead.customerName || "Unnamed Lead"}</CardTitle>
                    <p className="text-sm text-muted-foreground">{lead.customerPhone || "No phone number"} &middot; {new Date(lead.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0 bg-muted p-1 rounded-lg ml-2">
                     <button onClick={() => onLoad(lead)} className="p-2 rounded-md text-muted-foreground hover:bg-border hover:text-foreground transition-colors" title="Load Lead"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg></button>
                     <button onClick={handleCopy} className="p-2 rounded-md text-muted-foreground hover:bg-border hover:text-foreground transition-colors" title="Copy Info">
                        {copied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                     </button>
                     <button onClick={() => onDelete(lead.id)} className="p-2 rounded-md text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors" title="Delete Lead"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted rounded-xl p-4">
                     <div className="text-center">
                        <p className="text-sm text-muted-foreground">Est. Monthly Total</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(totalMonthlyInCents)}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm text-muted-foreground">Est. Due Today</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(dueTodayInCents)}</p>
                    </div>
                </div>

                <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                            {/* Monthly Breakdown */}
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Monthly Breakdown</h4>
                                <div className="divide-y divide-border rounded-lg border border-border p-2">
                                    <DetailRow label={`${planDetails.name} (${lead.lines} Line${lead.lines > 1 ? 's' : ''})`} value={formatCurrency(basePlanPriceInCents)} />
                                    {autopayDiscountInCents > 0 && <DetailRow label="AutoPay Discount" value={`-${formatCurrency(autopayDiscountInCents)}`} valueClassName="text-green-600 dark:text-green-400" />}
                                    {insiderDiscountInCents > 0 && <DetailRow label="Insider Discount" value={`-${formatCurrency(insiderDiscountInCents)}`} valueClassName="text-green-600 dark:text-green-400" />}
                                    {thirdLineFreeDiscountInCents > 0 && <DetailRow label="3rd Line Free" value={`-${formatCurrency(thirdLineFreeDiscountInCents)}`} valueClassName="text-green-600 dark:text-green-400" />}
                                    
                                    {insuranceCostInCents > 0 && <DetailRow label={`Insurance (${insuranceDetails.name})`} value={formatCurrency(insuranceCostInCents)} />}
                                    {monthlyDevicePaymentInCents > 0 && <DetailRow label="Device Financing" value={formatCurrency(monthlyDevicePaymentInCents)} />}
                                    {financedAccessories.map(acc => {
                                        const monthlyPaymentInCents = Math.round(Math.round(acc.price * 100 * (acc.quantity || 1)) / 12);
                                        return <DetailRow key={acc.id} label={`Financed: ${acc.name} (x${acc.quantity})`} value={formatCurrency(monthlyPaymentInCents)} isSubtle />
                                    })}
                                    {monthlyTradeInCreditInCents > 0 && <DetailRow label="Monthly Trade-in Credit" value={`-${formatCurrency(monthlyTradeInCreditInCents)}`} valueClassName="text-green-600 dark:text-green-400" />}
                                    
                                    <DetailRow label="Est. Taxes & Fees" value={planDetails.taxesIncluded ? "Included" : formatCurrency(calculatedTaxesInCents)} />
                                </div>
                            </div>

                             {/* Due Today Breakdown */}
                            {dueTodayInCents > 0 && (
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Due Today Breakdown</h4>
                                <div className="divide-y divide-border rounded-lg border border-border p-2">
                                    {activationFeeInCents > 0 && <DetailRow label="Activation Fee" value={formatCurrency(activationFeeInCents)} />}
                                    {upgradeFeeInCents > 0 && <DetailRow label="Upgrade Fee" value={formatCurrency(upgradeFeeInCents)} />}
                                    {paidInFullAccessories.map(acc => (
                                        <DetailRow key={acc.id} label={`Paid in Full: ${acc.name} (x${acc.quantity})`} value={formatCurrency(Math.round(acc.price * 100 * acc.quantity))} />
                                    ))}
                                    {dueTodayDeviceTaxInCents > 0 && <DetailRow label="Device Tax" value={formatCurrency(dueTodayDeviceTaxInCents)} />}
                                    {dueTodayFeesTaxInCents > 0 && <DetailRow label="Fee Tax" value={formatCurrency(dueTodayFeesTaxInCents)} />}
                                    {paidInFullAccessoriesTaxInCents > 0 && <DetailRow label="Accessory Tax (Paid)" value={formatCurrency(paidInFullAccessoriesTaxInCents)} />}
                                    {financedAccessoriesTaxInCents > 0 && <DetailRow label="Accessory Tax (Financed)" value={formatCurrency(financedAccessoriesTaxInCents)} />}
                                    {lumpSumTradeInInCents > 0 && <DetailRow label="Upfront Credit" value={`-${formatCurrency(lumpSumTradeInInCents)}`} valueClassName="text-green-600 dark:text-green-400" />}
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="text-center pt-4">
                    <button 
                        onClick={() => setIsExpanded(prev => !prev)}
                        className="flex items-center justify-center w-full sm:w-auto mx-auto space-x-2 text-sm font-semibold text-primary hover:text-pink-700 dark:hover:text-pink-500 transition-colors"
                        aria-expanded={isExpanded}
                    >
                        <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}

interface SavedLeadsProps {
  leads: SavedLead[];
  onLoad: (lead: SavedLead) => void;
  onDelete: (leadId: string) => void;
  planPricing: PlanPricingData;
  discountSettings: DiscountSettings;
  insurancePlans: InsurancePlan[];
}

const SavedLeads: React.FC<SavedLeadsProps> = ({ leads, onLoad, onDelete, planPricing, discountSettings, insurancePlans }) => {
  return (
    <>
      {leads.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-foreground">No saved leads</h3>
          <p className="mt-1 text-sm text-muted-foreground">Save a quote to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} planPricing={planPricing} onLoad={onLoad} onDelete={onDelete} discountSettings={discountSettings} insurancePlans={insurancePlans} />
          ))}
        </div>
      )}
    </>
  );
};

export default SavedLeads;
