import React, { useState, useEffect, useRef } from 'react';
import { PlanPricingData, PlanDetails, CustomerType, DiscountSettings, InsurancePlan } from '../types';
import Input from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Toggle from './ui/Toggle';

interface AdminPanelProps {
  currentPricing: PlanPricingData;
  preparedByName: string;
  preparedByNumber: string;
  discountSettings: DiscountSettings;
  insurancePlans: InsurancePlan[];
  onSave: (settings: { pricing: PlanPricingData; name: string; number: string; discounts: DiscountSettings; insurance: InsurancePlan[]; }) => void;
  onReset: () => void;
  onClose: () => void;
}

const allCustomerTypes: { id: CustomerType; label: string }[] = [
  { id: CustomerType.STANDARD, label: 'Standard' },
  { id: CustomerType.MILITARY_FR, label: 'Military & FR' },
  { id: CustomerType.PLUS_55, label: '55+' },
];

const navItems = [
    { id: 'general', label: 'General', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l-1.41-.513M5.106 17.785l1.153-.96m13.09-11.56l-1.153-.96M17.785 5.106l-1.153.96m-13.09 11.56l1.153.96m-5.13 1.41l.513-1.41m5.13-14.095l.513 1.41M12 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg> },
    { id: 'discounts', label: 'Discounts', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg> },
    { id: 'insurance', label: 'Insurance', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg> },
    { id: 'plans', label: 'Plans', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg> },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ currentPricing, preparedByName, preparedByNumber, discountSettings, insurancePlans, onSave, onReset, onClose }) => {
  const [editablePricing, setEditablePricing] = useState<PlanPricingData>(JSON.parse(JSON.stringify(currentPricing)));
  const [editableName, setEditableName] = useState(preparedByName);
  const [editableNumber, setEditableNumber] = useState(preparedByNumber);
  const [editableDiscounts, setEditableDiscounts] = useState(discountSettings);
  const [editableInsurance, setEditableInsurance] = useState<InsurancePlan[]>(JSON.parse(JSON.stringify(insurancePlans)));
  const [activeTab, setActiveTab] = useState<'general' | 'discounts' | 'insurance' | 'plans'>('general');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When a new plan is added, expand it automatically.
    const currentKeys = Object.keys(currentPricing);
    const editableKeys = Object.keys(editablePricing);
    if (editableKeys.length > currentKeys.length) {
      const newKey = editableKeys.find(key => !currentKeys.includes(key));
      if (newKey) {
        setExpandedPlan(newKey);
      }
    }
  }, [editablePricing, currentPricing]);

  const handlePriceChange = (planKey: string, lineIndex: number, value: string) => {
    const newPrice = Number(value);
    if (!isNaN(newPrice)) {
       setEditablePricing(prev => {
        const newPlanDetails = { ...prev[planKey] };
        newPlanDetails.price = [...newPlanDetails.price];
        newPlanDetails.price[lineIndex] = newPrice;
        return {
          ...prev,
          [planKey]: newPlanDetails,
        };
      });
    }
  };
  
  const handlePlanDetailChange = (planKey: string, field: keyof PlanDetails, value: string) => {
    setEditablePricing(prev => {
        const currentPlanDetails = prev[planKey];
        const newPlanDetails = { ...currentPlanDetails };

        if (field === 'maxLines') {
            const newMaxLines = parseInt(value, 10);
            if (isNaN(newMaxLines) || newMaxLines <= 0 || newMaxLines > 20) return prev;

            newPlanDetails.maxLines = newMaxLines;
            const newPriceArray = [...currentPlanDetails.price];
            const currentLength = newPriceArray.length;

            if (newMaxLines > currentLength) {
                const lastPrice = currentLength > 0 ? newPriceArray[currentLength - 1] : 0;
                for (let i = currentLength; i < newMaxLines; i++) {
                    newPriceArray.push(lastPrice);
                }
            } else if (newMaxLines < currentLength) {
                newPriceArray.length = newMaxLines;
            }
            newPlanDetails.price = newPriceArray;
        } else if (field === 'name') {
            newPlanDetails.name = value;
        }
        
        return { ...prev, [planKey]: newPlanDetails };
    });
  };

  const handleTaxesIncludedChange = (planKey: string, isChecked: boolean) => {
    setEditablePricing(prev => ({
        ...prev,
        [planKey]: { ...prev[planKey], taxesIncluded: isChecked }
    }));
  };
  
  const handleCustomerTypeAvailabilityChange = (planKey: string, customerType: CustomerType, isChecked: boolean) => {
    setEditablePricing(prev => {
        const planDetails = prev[planKey];
        let availableFor = [...(planDetails.availableFor || [])];
        if (isChecked) {
            if (!availableFor.includes(customerType)) availableFor.push(customerType);
        } else {
            availableFor = availableFor.filter(aff => aff !== customerType);
        }
        return { ...prev, [planKey]: { ...planDetails, availableFor } };
    });
  };

  const handleAddPlan = () => {
    const newPlanKey = `plan_${crypto.randomUUID()}`;
    setEditablePricing(prev => ({
      ...prev,
      [newPlanKey]: {
        name: 'Untitled Plan',
        price: [0, 0, 0],
        maxLines: 3,
        availableFor: [CustomerType.STANDARD],
        taxesIncluded: false,
      },
    }));
  };

  const confirmDeletePlan = () => {
    if (!planToDelete) return;
    setEditablePricing(prev => {
      const newState = { ...prev };
      delete newState[planToDelete];
      return newState;
    });
    setPlanToDelete(null); // Close modal after deletion
  };

  const handleAddInsurancePlan = () => {
    setEditableInsurance(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: 'New Insurance Plan', price: 0 }
    ]);
  };

  const handleDeleteInsurancePlan = (idToDelete: string) => {
    setEditableInsurance(prev => prev.filter(plan => plan.id !== idToDelete));
  };

  const handleInsuranceChange = (id: string, field: 'name' | 'price', value: string) => {
      setEditableInsurance(prev => prev.map(plan => {
          if (plan.id === id) {
              const newValue = field === 'price' ? (Number(value) || 0) : value;
              return { ...plan, [field]: newValue };
          }
          return plan;
      }));
  };

  const handleSave = () => {
    onSave({ pricing: editablePricing, name: editableName, number: editableNumber, discounts: editableDiscounts, insurance: editableInsurance });
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? Any custom plans will be removed.')) {
        onReset();
    }
  }
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-down">
      <div
        ref={modalRef}
        className="bg-slate-50 dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
      >
        <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Admin Panel</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <main className="flex-grow flex flex-col overflow-hidden">
            <nav className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 px-2 sm:px-4">
                <div className="flex items-center space-x-1 sm:space-x-2 -mb-px overflow-x-auto">
                    {navItems.map(item => (
                         <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`flex items-center space-x-2 whitespace-nowrap py-3 px-3 sm:px-4 text-sm font-medium transition-colors border-b-2 focus:outline-none focus:ring-2 focus:ring-tmobile-magenta focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded-t-md ${
                                activeTab === item.id 
                                ? 'border-tmobile-magenta text-tmobile-magenta' 
                                : 'border-transparent text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-100'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
            <div className="flex-grow p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-800/50">
                <div className="space-y-6 animate-fade-in-down">
                    {activeTab === 'general' && (
                        <Card>
                            <CardHeader><CardTitle>Quote Footer Settings</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Prepared by Name" value={editableName} onChange={(e) => setEditableName(e.target.value)} />
                                <Input label="Prepared by Number" value={editableNumber} onChange={(e) => setEditableNumber(e.target.value)} />
                            </CardContent>
                        </Card>
                    )}
                    {activeTab === 'discounts' && (
                        <Card>
                            <CardHeader><CardTitle>Discount Settings</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="AutoPay Discount per Line" type="number" prefix="$" value={editableDiscounts.autopay} onChange={(e) => setEditableDiscounts(d => ({...d, autopay: Number(e.target.value) || 0}))} />
                                <Input label="Insider Code Percentage" type="number" suffix="%" value={editableDiscounts.insider} onChange={(e) => setEditableDiscounts(d => ({...d, insider: Number(e.target.value) || 0}))} />
                            </CardContent>
                        </Card>
                    )}
                    {activeTab === 'insurance' && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle>Insurance Settings</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    {editableInsurance.map((plan, index) => (
                                        <div key={plan.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Plan #{index + 1}</p>
                                                <button
                                                    onClick={() => handleDeleteInsurancePlan(plan.id)}
                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                    aria-label={`Remove Plan ${plan.name}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.92-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Input label="Plan Name" value={plan.name} onChange={(e) => handleInsuranceChange(plan.id, 'name', e.target.value)} />
                                                <Input label="Plan Price" type="number" prefix="$" value={plan.price} onChange={(e) => handleInsuranceChange(plan.id, 'price', e.target.value)} />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={handleAddInsurancePlan}
                                        className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-tmobile-magenta hover:text-tmobile-magenta dark:hover:border-tmobile-magenta dark:hover:text-tmobile-magenta transition-colors duration-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Add Insurance Plan</span>
                                    </button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {activeTab === 'plans' && (
                        <div className="space-y-4">
                            {(Object.entries(editablePricing) as [string, PlanDetails][]).map(([planKey, planDetails]) => (
                                <div key={planKey} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <button 
                                        onClick={() => setExpandedPlan(expandedPlan === planKey ? null : planKey)}
                                        className="w-full flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-t-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                    >
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">{planDetails.name}</h4>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 text-slate-500 transition-transform ${expandedPlan === planKey ? 'rotate-180' : ''}`}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>
                                    {expandedPlan === planKey && (
                                        <div className="p-4 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="sm:col-span-2"><Input label="Plan Name" type="text" value={planDetails.name} onChange={(e) => handlePlanDetailChange(planKey, 'name', e.target.value)} /></div>
                                                <Input label="Line Limit" type="number" value={planDetails.maxLines} onChange={(e) => handlePlanDetailChange(planKey, 'maxLines', e.target.value)} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Available For</p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                        {allCustomerTypes.map(ct => (<label key={ct.id} className="flex items-center space-x-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-tmobile-magenta focus:ring-tmobile-magenta" checked={planDetails.availableFor?.includes(ct.id) || false} onChange={(e) => handleCustomerTypeAvailabilityChange(planKey, ct.id, e.target.checked)} /><span>{ct.label}</span></label>))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <Toggle label="Taxes & Fees Included" description="Taxes won't be calculated separately." name={`${planKey}-taxesIncluded`} checked={planDetails.taxesIncluded || false} onChange={(e) => handleTaxesIncludedChange(planKey, e.target.checked)} />
                                                </div>
                                            </div>
                                            <hr className="my-2 border-slate-200 dark:border-slate-700"/>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Line Pricing</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                                                {planDetails.price.map((price, index) => (<Input key={index} label={`${index + 1} Line${index > 0 ? 's' : ''}`} type="number" prefix="$" value={price} onChange={(e) => handlePriceChange(planKey, index, e.target.value)} />))}
                                            </div>
                                            <div className="pt-2 flex justify-end">
                                               <button onClick={() => setPlanToDelete(planKey)} className="flex items-center space-x-2 text-sm font-semibold text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 transition-colors" aria-label="Delete Plan">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.92-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                    <span>Delete Plan</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button onClick={handleAddPlan} className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-tmobile-magenta hover:text-tmobile-magenta dark:hover:border-tmobile-magenta dark:hover:text-tmobile-magenta transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Add New Plan</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>

        <footer className="p-4 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button onClick={handleReset} className="w-full sm:w-auto bg-slate-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors">Reset to Defaults</button>
            <button onClick={handleSave} className="w-full sm:w-auto bg-tmobile-magenta text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tmobile-magenta dark:focus:ring-offset-slate-800 transition-colors">Save Changes</button>
        </footer>
      </div>

      {planToDelete && (
          <div className="absolute inset-0 bg-slate-900/80 z-10 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 animate-fade-in-down">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confirm Deletion</h3>
              </div>
              <div className="p-5">
                <p className="text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete the plan "{editablePricing[planToDelete]?.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center space-x-3">
                <button onClick={() => setPlanToDelete(null)} className="w-auto bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDeletePlan} className="w-auto bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 dark:focus:ring-offset-slate-800 transition-colors">
                  Delete Plan
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AdminPanel;