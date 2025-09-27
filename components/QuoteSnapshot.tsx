import React, { useRef, useState } from 'react';
import { QuoteConfig, PlanPricingData, DiscountSettings, InsurancePlan, TradeInType, AccessoryPaymentType } from '../types';

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
  isSubtle?: boolean;
  icon?: React.ReactNode;
  iconClassName?: string;
}> = ({ label, value, valueClassName = 'text-slate-700 dark:text-slate-200', isSubtle = false, icon, iconClassName = 'text-slate-400' }) => (
  <div className={`flex justify-between items-center py-2 ${isSubtle ? 'pl-8' : ''}`}>
    <div className="flex items-center gap-3 text-sm">
      {icon && <div className={`flex-shrink-0 w-5 h-5 ${iconClassName}`}>{icon}</div>}
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
    </div>
    <span className={`font-semibold ${valueClassName}`}>{value}</span>
  </div>
);


const QuoteSnapshot: React.FC<QuoteSnapshotProps> = ({ config, planPricing, onSave, preparedByName, preparedByNumber, discountSettings, insurancePlans }) => {
  const { plan, lines, devices, discounts, taxRate, insuranceTier, insuranceLines, fees, accessories } = config;
  const snapshotRef = useRef<HTMLDivElement>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const isSaveLeadDisabled = !config.customerName.trim();

  const handleSaveImage = () => {
    if (snapshotRef.current) {
        (window as any).html2canvas(snapshotRef.current, {
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f1f5f9',
            scale: 2.5,
        }).then((canvas: HTMLCanvasElement) => {
            const link = document.createElement('a');
            link.download = `t-mobile-quote-${config.customerName || 'customer'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };

  const planDetails = planPricing[plan];
  if (!planDetails) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
            <p className="text-center text-slate-500 dark:text-slate-400">Please select a valid plan.</p>
        </div>
    );
  }

  // --- Calculation Refactor: Use cents for all monetary values to avoid floating-point errors ---
  const toCents = (dollars: number) => Math.round(dollars * 100);

  const formatCurrency = (amountInCents: number) => {
    return (amountInCents / 100).toLocaleString(navigator.language, {
        style: 'currency',
        currency: 'USD'
    });
  };

  const basePlanPriceInCents = toCents(planDetails.price[lines - 1] || 0);

  // Discounts
  const autopayDiscountInCents = discounts.autopay ? toCents(lines * discountSettings.autopay) : 0;
  const insiderDiscountValue = basePlanPriceInCents * (discountSettings.insider / 100);
  const insiderDiscountInCents = discounts.insider ? Math.round(insiderDiscountValue) : 0;
  
  let thirdLineFreeDiscountInCents = 0;
  if (discounts.thirdLineFree && lines >= 3) {
      const twoLinePrice = planDetails.price[1];
      const threeLinePrice = planDetails.price[2];
      thirdLineFreeDiscountInCents = toCents(threeLinePrice - twoLinePrice);
  }
  const totalDiscountsInCents = autopayDiscountInCents + insiderDiscountInCents + thirdLineFreeDiscountInCents;
  
  // Device costs and trade-ins
  const totalDeviceCostInCents = devices.reduce((sum, dev) => sum + toCents(Number(dev.price) || 0), 0);
  
  const lumpSumTradeInInCents = devices
    .filter(dev => dev.tradeInType === TradeInType.LUMP_SUM)
    .reduce((sum, dev) => sum + toCents(Number(dev.tradeIn) || 0), 0);
    
  const monthlyCreditTradeInValue = devices
    .filter(dev => dev.tradeInType === TradeInType.MONTHLY_CREDIT)
    .reduce((sum, dev) => sum + (Number(dev.tradeIn) || 0), 0);
  const monthlyCreditTradeInInCents = toCents(monthlyCreditTradeInValue);
    
  const monthlyDevicePaymentInCents = totalDeviceCostInCents > 0 ? Math.round(totalDeviceCostInCents / 24) : 0;
  const monthlyTradeInCreditInCents = monthlyCreditTradeInInCents > 0 ? Math.round(monthlyCreditTradeInInCents / 24) : 0;
  
  const finalPlanPriceInCents = basePlanPriceInCents - totalDiscountsInCents;
  
  // Add-ons
  const insuranceDetails = insuranceTier === 'none'
    ? { id: 'none', name: 'None', price: 0 }
    : insurancePlans.find(p => p.id === insuranceTier) || { id: 'not-found', name: 'N/A', price: 0 };
  const insuranceCostInCents = toCents(insuranceDetails.price * (insuranceLines || 0));

  // Accessories
  const safeAccessories = accessories || [];
  const paidInFullAccessories = safeAccessories.filter(acc => acc.paymentType === AccessoryPaymentType.FULL);
  const financedAccessories = safeAccessories.filter(acc => acc.paymentType === AccessoryPaymentType.FINANCED);

  const paidInFullAccessoriesCostInCents = paidInFullAccessories
    .reduce((sum, acc) => sum + toCents(acc.price * (acc.quantity || 1)), 0);
  const paidInFullAccessoriesTaxInCents = Math.round(paidInFullAccessoriesCostInCents * ((Number(taxRate) || 0) / 100));
  
  const financedAccessoriesCostInCents = financedAccessories
    .reduce((sum, acc) => sum + toCents(acc.price * (acc.quantity || 1)), 0);
  const financedAccessoriesTaxInCents = Math.round(financedAccessoriesCostInCents * ((Number(taxRate) || 0) / 100));
  const financedAccessoriesMonthlyCostInCents = financedAccessoriesCostInCents > 0 ? Math.round(financedAccessoriesCostInCents / 12) : 0;
  
  const totalMonthlyAddonsInCents = insuranceCostInCents + monthlyDevicePaymentInCents + financedAccessoriesMonthlyCostInCents - monthlyTradeInCreditInCents;

  // Taxes and fees
  const insurancePricePerLineInCents = toCents(insuranceDetails.price);
  let calculatedTaxesInCents = 0;

  if (!planDetails.taxesIncluded) {
    const planPricesInCents = planDetails.price.map(toCents);
    let taxableMonthlyAmountInCents = 0;
    // We only need the final monthly price for tax, not per-line breakdown.
    const monthlyPlanCostBeforeDiscounts = basePlanPriceInCents;
    const monthlyInsuranceCost = insuranceCostInCents;
    
    // Taxes apply to plan and insurance before discounts
    taxableMonthlyAmountInCents = monthlyPlanCostBeforeDiscounts + monthlyInsuranceCost;
    
    calculatedTaxesInCents = Math.round(taxableMonthlyAmountInCents * ((Number(taxRate) || 0) / 100));
  }

  // One-time fees
  const activationFeeInCents = fees?.activation ? toCents(lines * 10) : 0;
  const upgradeFeeInCents = fees?.upgrade ? toCents(lines * 35) : 0;
  const totalOneTimeFeesInCents = activationFeeInCents + upgradeFeeInCents;

  // Totals
  const totalMonthlyInCents = finalPlanPriceInCents + totalMonthlyAddonsInCents + calculatedTaxesInCents;
  
  const dueTodayDeviceTaxInCents = Math.round(totalDeviceCostInCents * ((Number(taxRate) || 0) / 100));
  const dueTodayFeesTaxInCents = Math.round(totalOneTimeFeesInCents * ((Number(taxRate) || 0) / 100));
  const dueTodayInCents = dueTodayDeviceTaxInCents - lumpSumTradeInInCents + totalOneTimeFeesInCents + dueTodayFeesTaxInCents + paidInFullAccessoriesCostInCents + paidInFullAccessoriesTaxInCents + financedAccessoriesTaxInCents;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
      <div ref={snapshotRef} className="bg-slate-100 dark:bg-slate-900 rounded-t-xl">
        <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-t-xl text-white">
            <h3 className="text-xl font-bold text-center">Quote Summary</h3>
            <p className="text-sm text-center text-slate-300">
              For {config.customerName || 'Your Customer'}
            </p>
        </div>
        
        <div className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-center flex flex-col justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Monthly</p>
                <p className="text-3xl font-bold tracking-tight text-tmobile-magenta">{formatCurrency(totalMonthlyInCents)}</p>
            </div>
             <div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-center flex flex-col justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Due Today</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(dueTodayInCents)}</p>
            </div>
          </div>

          <div className="text-center pt-2">
              <button 
                  onClick={() => setIsDetailsExpanded(prev => !prev)}
                  className="flex items-center justify-center w-full sm:w-auto mx-auto space-x-2 text-sm font-semibold text-tmobile-magenta hover:text-pink-700 dark:hover:text-pink-500 transition-colors"
                  aria-expanded={isDetailsExpanded}
              >
                  <span>{isDetailsExpanded ? 'Hide Pricing Details' : 'View Pricing Details'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 transition-transform duration-300 ${isDetailsExpanded ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
              </button>
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${isDetailsExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden space-y-4 pt-4">
                  {/* Monthly Breakdown */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-tmobile-magenta"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" /></svg>
                      Monthly Bill Breakdown
                    </h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      <DetailRow label={`${planDetails.name} (${lines} Line${lines > 1 ? 's' : ''})`} value={formatCurrency(basePlanPriceInCents)} />
                      
                      {autopayDiscountInCents > 0 && <DetailRow label="AutoPay Discount" value={`-${formatCurrency(autopayDiscountInCents)}`} valueClassName="text-green-600 dark:text-green-400" />}
                      {insiderDiscountInCents > 0 && <DetailRow label="Insider Discount" value={`-${formatCurrency(insiderDiscountInCents)}`} valueClassName="text-green-600 dark:text-green-400" />}
                      {thirdLineFreeDiscountInCents > 0 && <DetailRow label="3rd Line Free" value={`-${formatCurrency(thirdLineFreeDiscountInCents)}`} valueClassName="text-green-600 dark:text-green-400" />}
                      
                      {insuranceCostInCents > 0 && <DetailRow label="Insurance" value={formatCurrency(insuranceCostInCents)} />}
                      {monthlyDevicePaymentInCents > 0 && <DetailRow label="Device Financing" value={formatCurrency(monthlyDevicePaymentInCents)} />}
                      {financedAccessories.map(acc => {
                          const monthlyPaymentInCents = Math.round(toCents(acc.price * (acc.quantity || 1)) / 12);
                          return <DetailRow key={acc.id} label={`Financed: ${acc.name} (x${acc.quantity})`} value={formatCurrency(monthlyPaymentInCents)} isSubtle />
                      })}
                      {monthlyTradeInCreditInCents > 0 && <DetailRow label="Monthly Trade-in Credit" value={`-${formatCurrency(monthlyTradeInCreditInCents)}`} valueClassName="text-green-600 dark:text-green-400" />}

                      <DetailRow label="Est. Taxes & Fees" value={planDetails.taxesIncluded ? "Included" : formatCurrency(calculatedTaxesInCents)} />
                      <DetailRow label="Monthly Total" value={formatCurrency(totalMonthlyInCents)} valueClassName="text-xl text-tmobile-magenta" />
                    </div>
                  </div>
                  
                  {/* Due Today Breakdown */}
                  {dueTodayInCents > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.5 3.75h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" /></svg>
                      Due Today Breakdown
                    </h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {activationFeeInCents > 0 && <DetailRow label="Activation Fee" value={formatCurrency(activationFeeInCents)} />}
                        {upgradeFeeInCents > 0 && <DetailRow label="Upgrade Fee" value={formatCurrency(upgradeFeeInCents)} />}
                        {paidInFullAccessories.map(acc => (
                            <DetailRow key={acc.id} label={`Paid in Full: ${acc.name} (x${acc.quantity})`} value={formatCurrency(toCents(acc.price * acc.quantity))} />
                        ))}
                        {dueTodayDeviceTaxInCents > 0 && <DetailRow label="Device Tax" value={formatCurrency(dueTodayDeviceTaxInCents)} />}
                        {dueTodayFeesTaxInCents > 0 && <DetailRow label="Fee Tax" value={formatCurrency(dueTodayFeesTaxInCents)} />}
                        {paidInFullAccessoriesTaxInCents > 0 && <DetailRow label="Accessory Tax (Paid)" value={formatCurrency(paidInFullAccessoriesTaxInCents)} />}
                        {financedAccessoriesTaxInCents > 0 && <DetailRow label="Accessory Tax (Financed)" value={formatCurrency(financedAccessoriesTaxInCents)} />}
                        {lumpSumTradeInInCents > 0 && <DetailRow label="Upfront Credit" value={`-${formatCurrency(lumpSumTradeInInCents)}`} valueClassName="text-green-600 dark:text-green-400" />}
                        <DetailRow label="Due Today Total" value={formatCurrency(dueTodayInCents)} valueClassName="text-xl text-slate-800 dark:text-slate-100" />
                    </div>
                  </div>
                  )}
              </div>
          </div>
          <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              <p className="font-semibold text-slate-500 dark:text-slate-400">Prepared by {preparedByName}</p>
              <p>{preparedByNumber}</p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-xl flex items-center justify-around">
          <button
              onClick={onSave}
              disabled={isSaveLeadDisabled}
              className="flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-tmobile-magenta dark:text-slate-300 dark:hover:text-tmobile-magenta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isSaveLeadDisabled ? "Enter a customer name to save." : "Save Quote as Lead"}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586L7.707 10.293z" /><path d="M3.5 4.5a1 1 0 011-1h11a1 1 0 011 1v1a1 1 0 01-1-1h-11a1 1 0 01-1-1v-1z" /></svg>
              <span>Save Quote</span>
          </button>
          <div className="h-6 border-l border-slate-200 dark:border-slate-600"></div>
          <button
              onClick={handleSaveImage}
              className="flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-tmobile-magenta dark:text-slate-300 dark:hover:text-tmobile-magenta transition-colors"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
              <span>Save as Image</span>
          </button>
      </div>
    </div>
  );
};

export default QuoteSnapshot;