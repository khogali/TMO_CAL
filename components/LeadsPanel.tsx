
import React, { useRef, useEffect, useState } from 'react';
import { SavedLead, PlanPricingData, DiscountSettings, CustomerType, InsurancePlan, TradeInType, AccessoryPaymentType } from '../types';
import SavedLeads from './SavedLeads';
import { calculateQuoteTotals } from '../utils/calculations';

interface LeadsPanelProps {
  leads: SavedLead[];
  planPricing: PlanPricingData;
  onLoad: (lead: SavedLead) => void;
  onDelete: (leadId: string) => void;
  onClose: () => void;
  discountSettings: DiscountSettings;
  insurancePlans: InsurancePlan[];
}

const getCustomerTypeLabel = (type: CustomerType) => {
    switch (type) {
        case CustomerType.STANDARD: return 'Standard Customer';
        case CustomerType.MILITARY_FR: return 'Military & FR';
        case CustomerType.PLUS_55: return '55+';
        default: return type;
    }
};

const LeadsPanel: React.FC<LeadsPanelProps> = ({ leads, planPricing, onLoad, onDelete, onClose, discountSettings, insurancePlans }) => {
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

    const formatCurrencyForCopy = (amountInCents: number) => (amountInCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const toCents = (dollars: number) => Math.round(dollars * 100);

    const allLeadsText = leads.map(lead => {
        const planDetails = planPricing[lead.plan];
        const totals = calculateQuoteTotals(lead, planPricing, discountSettings, insurancePlans);

        if (!planDetails || !totals) return `*** Incomplete data for lead: ${lead.customerName} ***`;

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
        const insuranceText = insuranceLines > 0 ? `${insuranceDetails.name} (${insuranceLines} line${insuranceLines > 1 ? 's' : ''})` : 'None';

        return `
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
${(lead.devices || []).length > 0 ? lead.devices.map((dev, i) => `Device ${i + 1}: ${formatCurrencyForCopy(toCents(dev.price))} (Trade-in: ${formatCurrencyForCopy(toCents(dev.tradeIn))} applied as ${dev.tradeInType === TradeInType.MONTHLY_CREDIT ? 'Monthly Credit' : 'Upfront Credit'})`).join('\n') : 'No devices'}

--- ACCESSORIES (${(lead.accessories || []).length}) ---
${(lead.accessories || []).length > 0 ? lead.accessories.map((acc, i) => `Accessory ${i + 1}: ${acc.name || 'Unnamed'} (x${acc.quantity || 1}) - ${formatCurrencyForCopy(toCents(acc.price))} (${acc.paymentType === AccessoryPaymentType.FINANCED ? 'Financed' : 'Paid in Full'})`).join('\n') : 'No accessories'}

--- DISCOUNTS ---
${appliedDiscounts.length > 0 ? appliedDiscounts.join(', ') : 'None'}

--- PRICING ---
Total Monthly Estimate: ${formatCurrencyForCopy(totals.totalMonthlyInCents)}
Amount Due Today: ${formatCurrencyForCopy(totals.dueTodayInCents)}
        `.trim().replace(/^\s+/gm, '');
    }).join('\n\n================================\n\n');

    navigator.clipboard.writeText(allLeadsText).then(() => {
        setIsBulkCopied(true);
        setTimeout(() => setIsBulkCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in-down">
      <div
        ref={modalRef}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl border border-border flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-border flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-lg font-bold text-foreground">Lead Management ({leads.length})</h2>
          </div>
          <div className="flex items-center space-x-2">
             <button 
              onClick={handleBulkCopy}
              disabled={leads.length === 0}
              className="hidden sm:flex items-center space-x-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed pr-2"
            >
              {isBulkCopied ? (
                 <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 16v-4.586a1 1 0 00-.293-.707l-6.414-6.414A1 1 0 008.586 4H7a2 2 0 00-2 2v12a2 2 0 002 2h4.586a1 1 0 00.707-.293l6.414-6.414a1 1 0 00.293-.707V16m-6-8h6m-3 3v6" /></svg>
                  <span>Copy All</span>
                </>
              )}
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto bg-muted">
           <SavedLeads 
              leads={leads}
              onLoad={onLoad}
              onDelete={onDelete}
              planPricing={planPricing}
              discountSettings={discountSettings}
              insurancePlans={insurancePlans}
           />
        </div>
      </div>
    </div>
  );
};

export default LeadsPanel;