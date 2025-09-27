import React, { useRef } from 'react';
import { QuoteConfig, InsuranceTier, PlanPricingData, DiscountSettings, InsurancePricingData } from '../types';
import { Card, CardContent } from './ui/Card';

interface QuoteSnapshotProps {
  config: QuoteConfig;
  planPricing: PlanPricingData;
  onSave: () => void;
  preparedByName: string;
  preparedByNumber: string;
  discountSettings: DiscountSettings;
  insurancePricing: InsurancePricingData;
}

const DetailRow: React.FC<{
  label: string;
  value: string;
  valueClassName?: string;
  isSubtle?: boolean;
}> = ({ label, value, valueClassName = 'text-slate-800 dark:text-slate-100', isSubtle = false }) => (
  <div className="flex justify-between items-baseline text-sm">
    <span className={`text-slate-500 dark:text-slate-400 ${isSubtle ? 'pl-4' : ''}`}>{label}</span>
    <span className={`font-semibold ${valueClassName}`}>{value}</span>
  </div>
);


const QuoteSnapshot: React.FC<QuoteSnapshotProps> = ({ config, planPricing, onSave, preparedByName, preparedByNumber, discountSettings, insurancePricing }) => {
  const { plan, lines, devices, discounts, taxRate, insuranceTier } = config;
  const snapshotRef = useRef<HTMLDivElement>(null);
  const isSaveLeadDisabled = !config.customerName.trim();

  const handleSaveImage = () => {
    if (snapshotRef.current) {
        (window as any).html2canvas(snapshotRef.current, {
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#f8fafc', // Match card bg
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
        <Card>
            <CardContent className="p-6">
                <p className="text-center text-slate-500 dark:text-slate-400">Please select a valid plan.</p>
            </CardContent>
        </Card>
    );
  }
  const basePlanPrice = planDetails.price[lines - 1] || 0;

  // Discounts
  const autopayDiscount = discounts.autopay ? lines * discountSettings.autopay : 0;
  const insiderDiscount = discounts.insider ? basePlanPrice * (discountSettings.insider / 100) : 0;
  
  let thirdLineFreeDiscount = 0;
  if (discounts.thirdLineFree && lines >= 3) {
      const twoLinePrice = planDetails.price[1];
      const threeLinePrice = planDetails.price[2];
      thirdLineFreeDiscount = threeLinePrice - twoLinePrice;
  }
  
  const finalPlanPrice = basePlanPrice - autopayDiscount - insiderDiscount - thirdLineFreeDiscount;
  
  // Add-ons
  const insuranceDetails = insurancePricing[insuranceTier];
  const insuranceCost = insuranceDetails.price * lines;

  // Device costs
  const totalDeviceCost = devices.reduce((sum, dev) => sum + (Number(dev.price) || 0), 0);
  const totalTradeIn = devices.reduce((sum, dev) => sum + (Number(dev.tradeIn) || 0), 0);
  const netDeviceCost = totalDeviceCost - totalTradeIn;
  const monthlyDevicePayment = netDeviceCost > 0 ? netDeviceCost / 24 : 0;

  // Taxes and fees
  const insurancePricePerLine = insuranceDetails.price;
  let calculatedTaxes = 0;

  if (!planDetails.taxesIncluded) {
    for (let i = 0; i < lines; i++) {
      const costOfThisLine = i === 0
        ? planDetails.price[0]
        : planDetails.price[i] - planDetails.price[i - 1];
      const taxableAmountForLine = costOfThisLine + insurancePricePerLine;
      calculatedTaxes += taxableAmountForLine * ((Number(taxRate) || 0) / 100);
    }
  }

  const estimatedTaxes = calculatedTaxes;

  // Totals
  const totalMonthly = finalPlanPrice + monthlyDevicePayment + insuranceCost + estimatedTaxes;
  const dueToday = netDeviceCost > 0 ? netDeviceCost * ((Number(taxRate) || 0) / 100) : 0;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const hasAppliedDiscounts = discounts.autopay || discounts.insider || (discounts.thirdLineFree && lines >= 3);
  const hasAddons = insuranceTier !== InsuranceTier.NONE || monthlyDevicePayment > 0;

  return (
    <Card>
      <div ref={snapshotRef} className="bg-white dark:bg-slate-800 rounded-t-xl">
        <CardContent className="p-0">
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
                <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white">Quote Summary</h3>
                <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                  For {config.customerName || 'Your Customer'}
                </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Plan Details</h4>
                  <div className="space-y-1">
                    <DetailRow label={`${planDetails.name} (${lines} Line${lines > 1 ? 's' : ''})`} value={formatCurrency(basePlanPrice)} />
                  </div>
                </div>

                {hasAppliedDiscounts && (
                  <div>
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Discounts</h4>
                    <div className="space-y-1">
                      {discounts.autopay && <DetailRow label="AutoPay" value={`-${formatCurrency(autopayDiscount)}`} isSubtle valueClassName="text-green-600 dark:text-green-400" />}
                      {discounts.insider && <DetailRow label="Insider Code" value={`-${formatCurrency(insiderDiscount)}`} isSubtle valueClassName="text-green-600 dark:text-green-400" />}
                      {discounts.thirdLineFree && lines >= 3 && <DetailRow label="3rd Line Free" value={`-${formatCurrency(thirdLineFreeDiscount)}`} isSubtle valueClassName="text-green-600 dark:text-green-400" />}
                    </div>
                  </div>
                )}
                
                 {hasAddons && (
                  <div>
                    <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Add-ons & Devices</h4>
                    <div className="space-y-1">
                      {insuranceTier !== InsuranceTier.NONE && <DetailRow label={insuranceDetails.name} value={formatCurrency(insuranceCost)} isSubtle/>}
                      {monthlyDevicePayment > 0 && <DetailRow label={`Devices (${devices.length}) - Monthly`} value={formatCurrency(monthlyDevicePayment)} isSubtle/>}
                    </div>
                  </div>
                )}
              </div>
              
              <hr className="border-slate-200 dark:border-slate-700 border-dashed"/>

              <div className="space-y-2">
                <DetailRow label="Subtotal after discounts" value={formatCurrency(finalPlanPrice)} />
                <DetailRow label="Est. Taxes & Fees" value={planDetails.taxesIncluded ? "Included" : formatCurrency(estimatedTaxes)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-tmobile-magenta text-white p-4 rounded-lg text-center flex flex-col justify-center">
                    <p className="text-sm font-medium opacity-90">Total Monthly</p>
                    <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalMonthly)}</p>
                </div>
                 <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center flex flex-col justify-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Due Today</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(dueToday)}</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 text-center text-xs text-slate-400 dark:text-slate-500">
                <p className="font-semibold text-slate-500 dark:text-slate-400">Prepared by {preparedByName}</p>
                <p>{preparedByNumber}</p>
            </div>
        </CardContent>
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-xl flex items-center justify-around">
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
    </Card>
  );
};

export default QuoteSnapshot;