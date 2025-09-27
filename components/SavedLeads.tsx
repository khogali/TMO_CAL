import React, { useState } from 'react';
import { SavedLead, PlanPricingData, Device, DiscountSettings, CustomerType, InsurancePricingData } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface SavedLeadsProps {
  leads: SavedLead[];
  onLoad: (lead: SavedLead) => void;
  onDelete: (leadId: string) => void;
  planPricing: PlanPricingData;
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

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-start text-sm">
    <p className="text-slate-500 dark:text-slate-400 flex-shrink-0 mr-2">{label}</p>
    <p className="font-medium text-slate-800 dark:text-slate-100 text-right">{value}</p>
  </div>
);


const LeadCard: React.FC<{ lead: SavedLead; planPricing: PlanPricingData; onLoad: (lead: SavedLead) => void; onDelete: (leadId: string) => void; discountSettings: DiscountSettings; insurancePricing: InsurancePricingData;}> = ({ lead, planPricing, onLoad, onDelete, discountSettings, insurancePricing }) => {
    const [copied, setCopied] = useState(false);

    const planDetails = planPricing[lead.plan];
    if (!planDetails) return null; // Or render an error state

    // Recalculate totals for display
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


    const handleCopy = () => {
        const copyText = `
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
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>{lead.customerName || "Unnamed Lead"}</CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{lead.customerPhone || "No phone number"} &middot; {new Date(lead.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                         <button onClick={() => onLoad(lead)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-slate-100 transition-colors" title="Load Lead"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg></button>
                         <button onClick={handleCopy} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-slate-100 transition-colors" title="Copy Info">
                            {copied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                         </button>
                         <button onClick={() => onDelete(lead.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Delete Lead"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Configuration</h4>
                        <div className="space-y-1.5 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                            <DetailRow label="Plan" value={`${planDetails.name} (${lead.lines} lines)`} />
                            <DetailRow label="Customer Type" value={getCustomerTypeLabel(lead.customerType)} />
                            <DetailRow label="Insurance" value={insurancePricing[lead.insuranceTier]?.name || 'None'} />
                        </div>
                    </div>
                     {appliedDiscounts.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Discounts</h4>
                            <div className="space-y-1.5 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                                {appliedDiscounts.map(disc => <DetailRow key={disc} label={disc} value="Applied" />)}
                            </div>
                        </div>
                    )}
                     {lead.devices.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Devices ({lead.devices.length})</h4>
                            <div className="space-y-1.5 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                                {lead.devices.map((dev: Device, i: number) => 
                                    <DetailRow key={i} label={`Device ${i+1}`} value={`${formatCurrency(dev.price)} (Trade: ${formatCurrency(dev.tradeIn)})`} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 flex flex-col justify-center space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Est. Monthly Total</p>
                        <p className="text-2xl font-bold text-tmobile-magenta">{formatCurrency(monthlyTotal)}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Est. Due Today</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(dueTodayTotal)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const SavedLeads: React.FC<SavedLeadsProps> = ({ leads, onLoad, onDelete, planPricing, discountSettings, insurancePricing }) => {
  return (
    <>
      {leads.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No saved leads</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Save a quote to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} planPricing={planPricing} onLoad={onLoad} onDelete={onDelete} discountSettings={discountSettings} insurancePricing={insurancePricing} />
          ))}
        </div>
      )}
    </>
  );
};

export default SavedLeads;