import React, { useState, useEffect, useRef } from 'react';
import { PlanPricingData, DiscountSettings, InsurancePlan, CustomerType, PlanDetails } from '../types';
import Input from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Toggle from './ui/Toggle';

interface AdminPanelProps {
  currentPricing: PlanPricingData;
  preparedByName: string;
  preparedByNumber: string;
  discountSettings: DiscountSettings;
  insurancePlans: InsurancePlan[];
  welcomeMessage: string | null;
  onSave: (settings: {
    pricing: PlanPricingData;
    name: string;
    number: string;
    discounts: DiscountSettings;
    insurance: InsurancePlan[];
    welcomeMessage: string;
  }) => void;
  onReset: () => void;
  onClose: () => void;
}

const getCustomerTypeLabel = (type: CustomerType) => {
    switch (type) {
        case CustomerType.STANDARD: return 'Standard';
        case CustomerType.MILITARY_FR: return 'Military & FR';
        case CustomerType.PLUS_55: return '55+';
        default: return type;
    }
};

const AdminPanel: React.FC<AdminPanelProps> = ({
  currentPricing,
  preparedByName,
  preparedByNumber,
  discountSettings,
  insurancePlans,
  welcomeMessage,
  onSave,
  onReset,
  onClose,
}) => {
  const [pricing, setPricing] = useState<PlanPricingData>(currentPricing);
  const [name, setName] = useState(preparedByName);
  const [number, setNumber] = useState(preparedByNumber);
  const [discounts, setDiscounts] = useState<DiscountSettings>(discountSettings);
  const [insurance, setInsurance] = useState<InsurancePlan[]>(insurancePlans);
  const [welcome, setWelcome] = useState(welcomeMessage || '');
  
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync internal state if props change (e.g., after a reset)
    setPricing(JSON.parse(JSON.stringify(currentPricing)));
    setName(preparedByName);
    setNumber(preparedByNumber);
    setDiscounts(JSON.parse(JSON.stringify(discountSettings)));
    setInsurance(JSON.parse(JSON.stringify(insurancePlans)));
    setWelcome(welcomeMessage || '');
  }, [currentPricing, preparedByName, preparedByNumber, discountSettings, insurancePlans, welcomeMessage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSave = () => {
    onSave({ pricing, name, number, discounts, insurance, welcomeMessage: welcome });
  };

  const addPlan = () => {
    const newPlanKey = `custom_${Date.now()}`;
    const newPlan: PlanDetails = {
        name: 'New Custom Plan',
        price: [0],
        maxLines: 1,
        minLines: 1,
        availableFor: [CustomerType.STANDARD],
        taxesIncluded: false,
    };
    setPricing(prev => ({
        ...prev,
        [newPlanKey]: newPlan
    }));
  };

  const removePlan = (planKeyToRemove: string) => {
    const planName = pricing[planKeyToRemove]?.name || 'this plan';
    if (window.confirm(`Are you sure you want to delete the "${planName}" plan? This cannot be undone.`)) {
        setPricing(prev => {
            const { [planKeyToRemove]: _, ...rest } = prev;
            return rest;
        });
    }
  };
  
  const handlePricingChange = (planKey: string, field: keyof PlanDetails, value: any) => {
    setPricing(prev => ({
        ...prev,
        [planKey]: {
            ...prev[planKey],
            [field]: value
        }
    }));
  };

  const handleMaxLinesChange = (planKey: string, value: string) => {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue > 0) {
        setPricing(prev => {
            const planToUpdate = prev[planKey];
            const currentPrices = planToUpdate.price;
            let newPrices = [...currentPrices];

            if (numericValue > currentPrices.length) {
                newPrices = [
                    ...currentPrices,
                    ...Array(numericValue - currentPrices.length).fill(0)
                ];
            } else if (numericValue < currentPrices.length) {
                newPrices = currentPrices.slice(0, numericValue);
            }

            return {
                ...prev,
                [planKey]: {
                    ...planToUpdate,
                    maxLines: numericValue,
                    price: newPrices
                }
            };
        });
    }
  };
  
  const handleLinePriceChange = (planKey: string, lineIndex: number, value: string) => {
      const numericValue = Number(value);
      if (!isNaN(numericValue)) {
          setPricing(prev => {
              const newPrices = [...prev[planKey].price];
              newPrices[lineIndex] = numericValue;
              return {
                  ...prev,
                  [planKey]: {
                      ...prev[planKey],
                      price: newPrices
                  }
              }
          });
      }
  };

  const handleInsuranceChange = (index: number, field: 'name' | 'price', value: string) => {
      const newInsurance = [...insurance];
      const finalValue = field === 'price' ? Number(value) : value;
      if (field === 'price' && isNaN(finalValue as number)) return;
      newInsurance[index] = {...newInsurance[index], [field]: finalValue};
      setInsurance(newInsurance);
  };
  
  const addInsurancePlan = () => {
      setInsurance([...insurance, { id: `new_${Date.now()}`, name: 'New Plan', price: 0 }]);
  };

  const removeInsurancePlan = (planId: string) => {
    const planToRemove = insurance.find(p => p.id === planId);
    if (window.confirm(`Are you sure you want to delete the "${planToRemove?.name || 'this plan'}" insurance plan? This cannot be undone.`)) {
      setInsurance(insurance.filter((plan) => plan.id !== planId));
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in-down">
      <div
        ref={modalRef}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl border border-border flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-border flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <h2 className="text-lg font-bold text-foreground">Admin Settings</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6 bg-muted">
            <Card>
                <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Input label="Prepared By Name" value={name} onChange={e => setName(e.target.value)} />
                    <Input label="Prepared By Number" value={number} onChange={e => setNumber(e.target.value)} />
                    <Input label="Welcome Message (Optional)" value={welcome} onChange={e => setWelcome(e.target.value)} placeholder="e.g. Special promotion this weekend!"/>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Discount Settings</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="AutoPay Discount ($ per line)" type="number" value={discounts.autopay} onChange={e => setDiscounts(d => ({ ...d, autopay: Number(e.target.value) }))} />
                    <Input label="Insider Discount (%)" type="number" value={discounts.insider} onChange={e => setDiscounts(d => ({ ...d, insider: Number(e.target.value) }))} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex justify-between items-center">
                    <CardTitle>Insurance Plans</CardTitle>
                    <button onClick={addInsurancePlan} className="text-sm font-semibold text-primary hover:text-pink-700 transition-colors flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Add Plan
                    </button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {insurance.map((plan, index) => (
                        <div key={plan.id} className="flex items-end gap-3 p-3 bg-background rounded-lg">
                            <div className="flex-grow"><Input label="Plan Name" value={plan.name} onChange={e => handleInsuranceChange(index, 'name', e.target.value)} /></div>
                            <div className="w-32"><Input label="Price" type="number" value={plan.price} onChange={e => handleInsuranceChange(index, 'price', e.target.value)} prefix="$" /></div>
                            <button onClick={() => removeInsurancePlan(plan.id)} className="h-12 w-12 flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" aria-label={`Remove ${plan.name} Plan`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <CardTitle>Service Plans</CardTitle>
                     <button onClick={addPlan} className="text-sm font-semibold text-primary hover:text-pink-700 transition-colors flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Add New Plan
                    </button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(Object.entries(pricing) as [string, PlanDetails][]).map(([planKey, planData]) => (
                        <Card key={planKey}>
                           <CardHeader>
                               <Input label="Plan Name" value={planData.name} onChange={e => handlePricingChange(planKey, 'name', e.target.value)} />
                           </CardHeader>
                           <CardContent className="space-y-4">
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <Input 
                                       label="Min Lines" 
                                       type="number" 
                                       value={planData.minLines || 1} 
                                       onChange={e => handlePricingChange(planKey, 'minLines', Number(e.target.value))}
                                       min="1"
                                   />
                                   <Input 
                                       label="Max Lines" 
                                       type="number" 
                                       value={planData.maxLines} 
                                       onChange={e => handleMaxLinesChange(planKey, e.target.value)}
                                       min={planData.minLines || 1}
                                   />
                               </div>
                               <div className="pt-4 border-t border-border">
                                   <p className="text-sm font-medium text-muted-foreground mb-2">Price Per Line ($)</p>
                                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                       {planData.price.map((price, i) => (
                                           <Input key={i} label={`${i + 1} Line${i > 0 ? 's' : ''}`} type="number" value={price} onChange={e => handleLinePriceChange(planKey, i, e.target.value)} />
                                       ))}
                                   </div>
                               </div>
                               <div className="pt-4 border-t border-border">
                                   <p className="text-sm font-medium text-muted-foreground mb-3">Available For</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {Object.values(CustomerType).map(ct => (
                                            <label key={ct} htmlFor={`${planKey}-${ct}`} className="flex items-center space-x-2 p-3 rounded-lg bg-background cursor-pointer hover:bg-border transition-colors">
                                                <input
                                                    type="checkbox"
                                                    id={`${planKey}-${ct}`}
                                                    checked={planData.availableFor.includes(ct)}
                                                    onChange={e => {
                                                        const newAvailableFor = e.target.checked
                                                            ? [...planData.availableFor, ct]
                                                            : planData.availableFor.filter(val => val !== ct);
                                                        handlePricingChange(planKey, 'availableFor', newAvailableFor);
                                                    }}
                                                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-card"
                                                />
                                                <span className="text-sm font-medium text-foreground">
                                                    {getCustomerTypeLabel(ct)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                               </div>
                               <div className="pt-4 border-t border-border">
                                   <Toggle 
                                       label="Taxes & Fees Included"
                                       checked={planData.taxesIncluded}
                                       onChange={e => handlePricingChange(planKey, 'taxesIncluded', e.target.checked)}
                                   />
                               </div>
                           </CardContent>
                            <div className="p-5 border-t border-border flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => removePlan(planKey)}
                                    className="text-sm font-semibold text-red-600 hover:bg-red-500/10 rounded-lg px-4 py-2 transition-colors flex items-center justify-center gap-2"
                                    aria-label={`Delete ${planData.name} plan`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Delete Plan
                                </button>
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
        
        <div className="p-4 bg-card border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0">
          <button
              onClick={onReset}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-border transition-colors"
          >
              Reset to Default
          </button>
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold bg-muted hover:bg-border transition-colors"
            >
                Cancel
            </button>
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-pink-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;