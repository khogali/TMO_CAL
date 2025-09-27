import React, { useRef, useEffect, useState } from 'react';
import { SavedLead, PlanPricingData, DiscountSettings, CustomerType, InsurancePricingData } from '../types';
import SavedLeads from './SavedLeads';

interface LeadsPanelProps {
  leads: SavedLead[];
  planPricing: PlanPricingData;
  onLoad: (lead: SavedLead) => void;
  onDelete: (leadId: string) => void;
  onClose: () => void;
  discountSettings: DiscountSettings;
  insurancePricing: InsurancePricingData;
}

const formatCurrency = (amount: number) => amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const getCustomerTypeLabel = (type: CustomerType) => {
    switch (type) {
        case CustomerType.STANDARD: return 'Standard Customer';
        case CustomerType.MILITARY_FR: return 'Military & FR';
        case CustomerType.PLUS_55: return '55+';
        default: return type;
    }
};

const LeadsPanel: React.FC<LeadsPanelProps> = ({ leads, planPricing, onLoad, onDelete, onClose, discountSettings, insurancePricing }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isBulkCopied, setIsBulkCopied] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleBulkCopy = () => {
    if (leads.length === 0) return;

    const allLeadsText = leads.map(lead => {
        const planDetails = planPricing[lead.plan];
        if (!planDetails) return `*** Incomplete data for lead: ${lead.customerName} ***`;

        const basePlanPrice = planDetails.price[lead.lines - 1] || 0;
        const autopayDiscount = lead.discounts.autopay ? lead.lines * discountSettings.autopay : 0;
        const insiderDiscount = lead.discounts.insider ? basePlanPrice * (discountSettings.insider / 100) : 0;
        let thirdLineFreeDiscount = 0;
        if (lead.discounts.thirdLineFree && lead.lines >= 3) {
          const twoLinePrice = planDetails.price[1] || 0;
          const threeLinePrice = planDetails.price[2] || 0;
          thirdLineFreeDiscount = threeLinePrice - twoLinePrice;
        }
        const finalPlanPrice = basePlanPrice - autopayDiscount - insiderDiscount - thirdLineFreeDiscount;
        const insuranceCost = insurancePricing[lead.insuranceTier].price * lead.lines;
        const totalDeviceCost = lead.devices.reduce((sum, dev) => sum + (Number(dev.price) || 0), 0);
        const totalTradeIn = lead.devices.reduce((sum, dev) => sum + (Number(dev.tradeIn) || 0), 0);
        const netDeviceCost = totalDeviceCost - totalTradeIn;
        const monthlyDevicePayment = netDeviceCost > 0 ? netDeviceCost / 24 : 0;
        let calculatedTaxes = 0;
        if (!planDetails.taxesIncluded) {
          const insurancePricePerLine = insurancePricing[lead.insuranceTier].price;
          for (let i = 0; i < lead.lines; i++) {
            const costOfThisLine = i === 0 ? planDetails.price[0] : planDetails.price[i] - planDetails.price[i - 1];
            const taxableAmountForLine = costOfThisLine + insurancePricePerLine;
            calculatedTaxes += taxableAmountForLine * ((Number(lead.taxRate) || 0) / 100);
          }
        }
        const monthlyTotal = finalPlanPrice + monthlyDevicePayment + insuranceCost + calculatedTaxes;
        const dueTodayTotal = netDeviceCost > 0 ? (netDeviceCost) * ((Number(lead.taxRate) || 0) / 100) : 0;
    
        const appliedDiscounts = Object.entries(lead.discounts).filter(([, val]) => val).map(([key]) => {
            if (key === 'autopay') return 'AutoPay';
            if (key === 'insider') return 'Insider Code';
            if (key === 'thirdLineFree') return '3rd Line Free';
            return '';
        }).filter(Boolean);

        return `
*** T-Mobile Quote Summary for ${lead.customerName} ***

--- CUSTOMER ---
Name: ${lead.customerName || 'N/A'}
Phone: ${lead.customerPhone || 'N/A'}

--- QUOTE ---
Customer Type: ${getCustomerTypeLabel(lead.customerType)}
Plan: ${planDetails.name} for ${lead.lines} line(s)
Insurance: ${insurancePricing[lead.insuranceTier]?.name || 'None'}

--- DEVICES (${lead.devices.length}) ---
${lead.devices.length > 0 ? lead.devices.map((dev, i) => `Device ${i + 1}: ${formatCurrency(dev.price)} (Trade-in: ${formatCurrency(dev.tradeIn)})`).join('\n') : 'No devices'}

--- DISCOUNTS ---
${appliedDiscounts.length > 0 ? appliedDiscounts.join(', ') : 'None'}

--- PRICING ---
Total Monthly Estimate: ${formatCurrency(monthlyTotal)}
Amount Due Today: ${formatCurrency(dueTodayTotal)}
        `.trim().replace(/^\s+/gm, '');
    }).join('\n\n================================\n\n');

    navigator.clipboard.writeText(allLeadsText).then(() => {
        setIsBulkCopied(true);
        setTimeout(() => setIsBulkCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-tmobile-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Lead Management ({leads.length})</h2>
          </div>
          <div className="flex items-center space-x-2">
             <button 
              onClick={handleBulkCopy}
              disabled={leads.length === 0}
              className="flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-tmobile-magenta dark:text-slate-300 dark:hover:text-tmobile-magenta transition-colors disabled:opacity-50 disabled:cursor-not-allowed pr-2"
            >
              {isBulkCopied ? (
                 <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 16v-4.586a1 1 0 00-.293-.707l-6.414-6.414A1 1 0 008.586 4H7a2 2 0 00-2 2v12a2 2 0 002 2h4.586a1 1 0 00.707-.293l6.414-6.414a1 1 0 00.293-.707V16m-6-8h6m-3 3v6" /></svg>
                  <span>Copy All Leads</span>
                </>
              )}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
           <SavedLeads 
              leads={leads}
              onLoad={onLoad}
              onDelete={onDelete}
              planPricing={planPricing}
              discountSettings={discountSettings}
              insurancePricing={insurancePricing}
           />
        </div>
      </div>
    </div>
  );
};

export default LeadsPanel;