

import React, { useRef, useState } from 'react';
import { QuoteConfig, PlanPricingData, DiscountSettings, InsurancePlan } from '../types';
import { calculateQuoteTotals } from '../utils/calculations';

interface QuoteSnapshotProps {
  config: QuoteConfig;
  planPricing: PlanPricingData;
  onSave: () => void;
  preparedByName: string;
  preparedByNumber: string;
  discountSettings: DiscountSettings;
  insurancePlans: InsurancePlan[];
}

const DetailRow: React.FC<{
  label: React.ReactNode;
  value: string;
  valueClassName?: string;
}> = ({ label, value, valueClassName = 'text-card-foreground' }) => (
  <div className="flex items-baseline justify-between text-sm gap-2">
    <span className="text-muted-foreground whitespace-nowrap">{label}</span>
    <div className="flex-1 border-b border-border border-dashed self-center translate-y-[-4px]"></div>
    <span className={`font-semibold whitespace-nowrap ${valueClassName}`}>{value}</span>
  </div>
);


const QuoteSnapshot: React.FC<QuoteSnapshotProps> = ({ config, planPricing, onSave, preparedByName, preparedByNumber, discountSettings, insurancePlans }) => {
  const { plan, lines } = config;
  const snapshotRef = useRef<HTMLDivElement>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const isSaveLeadDisabled = !config.customerName.trim();

  const handleSaveImage = () => {
    if (snapshotRef.current) {
        (window as any).html2canvas(snapshotRef.current, {
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
            scale: 2.5,
        }).then((canvas: HTMLCanvasElement) => {
            const link = document.createElement('a');
            link.download = `t-mobile-quote-${config.customerName || 'customer'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };
  
  const formatCurrency = (amountInCents: number) => {
    return (amountInCents / 100).toLocaleString(navigator.language, {
        style: 'currency',
        currency: 'USD'
    });
  };

  const planDetails = planPricing[plan];
  const totals = calculateQuoteTotals(config, planPricing, discountSettings, insurancePlans);

  if (!planDetails || !totals) {
    return (
        <div className="bg-card rounded-2xl shadow-soft p-6">
            <p className="text-center text-muted-foreground">Please select a valid plan.</p>
        </div>
    );
  }

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
    financedAccessoriesMonthlyCostInCents,
    monthlyTradeInCreditInCents,
    calculatedTaxesInCents,
    activationFeeInCents,
    upgradeFeeInCents,
    paidInFullAccessories,
    dueTodayDeviceTaxInCents,
    dueTodayFeesTaxInCents,
    paidInFullAccessoriesTaxInCents,
    financedAccessoriesTaxInCents,
    lumpSumTradeInInCents,
    optionalDownPaymentInCents,
    requiredDownPaymentInCents,
  } = totals;

  const totalMonthlyFinancing = monthlyDevicePaymentInCents + financedAccessoriesMonthlyCostInCents;
  const greenText = "text-green-600 dark:text-green-400";
  const orangeText = "text-orange-600 dark:text-orange-400";
  
  const monthlyDetails = [
      { label: `${planDetails.name} (${lines} Line${lines > 1 ? 's' : ''})`, value: formatCurrency(basePlanPriceInCents) },
      autopayDiscountInCents > 0 && { label: "AutoPay Discount", value: `-${formatCurrency(autopayDiscountInCents)}`, className: greenText },
      insiderDiscountInCents > 0 && { label: "Insider Discount", value: `-${formatCurrency(insiderDiscountInCents)}`, className: greenText },
      thirdLineFreeDiscountInCents > 0 && { label: "3rd Line Free", value: `-${formatCurrency(thirdLineFreeDiscountInCents)}`, className: greenText },
      insuranceCostInCents > 0 && { label: "Insurance", value: formatCurrency(insuranceCostInCents) },
      totalMonthlyFinancing > 0 && { label: "Device & Accessory Financing", value: formatCurrency(totalMonthlyFinancing) },
      ...financedAccessories.map(acc => ({
          label: `${acc.name} (x${acc.quantity})`, value: formatCurrency(acc.monthlyPaymentInCents)
      })),
      monthlyTradeInCreditInCents > 0 && { label: "Trade-in Credit", value: `-${formatCurrency(monthlyTradeInCreditInCents)}`, className: greenText },
      { label: "Est. Taxes & Fees", value: planDetails.taxesIncluded ? "Included" : formatCurrency(calculatedTaxesInCents) }
  ].filter(Boolean);

  const dueTodayDetails = [
      optionalDownPaymentInCents > 0 && { label: "Optional Down Payment", value: formatCurrency(optionalDownPaymentInCents) },
      requiredDownPaymentInCents > 0 && { label: "Required Down Payment", value: formatCurrency(requiredDownPaymentInCents), className: orangeText },
      activationFeeInCents > 0 && { label: "Activation Fee", value: formatCurrency(activationFeeInCents) },
      upgradeFeeInCents > 0 && { label: "Upgrade Fee", value: formatCurrency(upgradeFeeInCents) },
      ...paidInFullAccessories.map(acc => ({
          label: `Paid in Full: ${acc.name} (x${acc.quantity})`, value: formatCurrency(Math.round(acc.price * 100 * acc.quantity))
      })),
      dueTodayDeviceTaxInCents > 0 && { label: "Device Tax", value: formatCurrency(dueTodayDeviceTaxInCents) },
      dueTodayFeesTaxInCents > 0 && { label: "Fee Tax", value: formatCurrency(dueTodayFeesTaxInCents) },
      paidInFullAccessoriesTaxInCents > 0 && { label: "Accessory Tax (Paid)", value: formatCurrency(paidInFullAccessoriesTaxInCents) },
      financedAccessoriesTaxInCents > 0 && { label: "Accessory Tax (Financed)", value: formatCurrency(financedAccessoriesTaxInCents) },
      lumpSumTradeInInCents > 0 && { label: "Upfront Credit", value: `-${formatCurrency(lumpSumTradeInInCents)}`, className: greenText }
  ].filter(Boolean);


  return (
    <div className="rounded-2xl shadow-soft-lg border border-border">
      <div ref={snapshotRef} className="bg-card rounded-t-2xl p-6">
        <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-foreground">Quote Summary</h3>
            <p className="text-sm text-muted-foreground">
              For {config.customerName || 'Your Customer'}
            </p>
        </div>
        
        <div className="bg-muted rounded-2xl p-6 my-6 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Estimated Monthly Bill</p>
            <p className="text-5xl lg:text-6xl font-extrabold tracking-tight text-primary leading-tight my-1">{formatCurrency(totalMonthlyInCents)}</p>
             <div className="h-px bg-border my-4 w-1/2 mx-auto"></div>
             <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Estimated Due Today</p>
            <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(dueTodayInCents)}</p>
        </div>

        <div className="text-center">
            <button 
                onClick={() => setIsDetailsExpanded(prev => !prev)}
                className="flex items-center justify-center w-full sm:w-auto mx-auto space-x-2 text-sm font-semibold text-primary hover:text-pink-700 dark:hover:text-pink-500 transition-colors"
                aria-expanded={isDetailsExpanded}
            >
                <span>{isDetailsExpanded ? 'Hide Details' : 'Show Details'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isDetailsExpanded ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
        </div>

        <div className={`grid transition-all duration-500 ease-in-out ${isDetailsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="space-y-6 pt-6">
                {/* Monthly Breakdown */}
                <div className="bg-muted p-4 rounded-xl border border-border">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Monthly Bill Breakdown
                  </h4>
                  <div className="space-y-3">
                    {monthlyDetails.map((item: any, index: number) => (
                       <DetailRow key={index} label={item.label} value={item.value} valueClassName={item.className} />
                    ))}
                  </div>
                </div>
                
                {/* Due Today Breakdown */}
                {dueTodayInCents > 0 && (
                <div className="bg-muted p-4 rounded-xl border border-border">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Due Today Breakdown
                  </h4>
                  <div className="space-y-3">
                     {dueTodayDetails.map((item: any, index: number) => (
                        <DetailRow key={index} label={item.label} value={item.value} valueClassName={item.className} />
                    ))}
                  </div>
                </div>
                )}
              </div>
            </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm font-semibold text-foreground">Prepared by {preparedByName}</p>
          <p className="text-xs text-muted-foreground">{preparedByNumber}</p>
        </div>
      </div>
      <div className="p-2 bg-card border-t border-border rounded-b-2xl flex items-center justify-around">
          <button
              onClick={onSave}
              disabled={isSaveLeadDisabled}
              className="flex items-center space-x-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-12 px-4 rounded-lg"
              title={isSaveLeadDisabled ? "Enter a customer name to save." : "Save Quote as Lead"}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586L7.707 10.293z" /><path d="M3.5 4.5a1 1 0 011-1h11a1 1 0 011 1v1a1 1 0 01-1-1h-11a1 1 0 01-1-1v-1z" /></svg>
              <span>Save Quote</span>
          </button>
          <div className="h-6 border-l border-border"></div>
          <button
              onClick={handleSaveImage}
              className="flex items-center space-x-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors h-12 px-4 rounded-lg"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
              <span>Save Image</span>
          </button>
      </div>
    </div>
  );
};

export default QuoteSnapshot;