import React, { useState, useEffect, useRef } from 'react';
import { PlanPricingData, PlanDetails, CustomerType, DiscountSettings, InsurancePricingData, InsuranceTier } from '../types';
import Input from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Toggle from './ui/Toggle';

interface AdminPanelProps {
  currentPricing: PlanPricingData;
  preparedByName: string;
  preparedByNumber: string;
  discountSettings: DiscountSettings;
  insurancePricing: InsurancePricingData;
  onSave: (settings: { pricing: PlanPricingData; name: string; number: string; discounts: DiscountSettings; insurance: InsurancePricingData; }) => void;
  onReset: () => void;
  onClose: () => void;
}

const allCustomerTypes: { id: CustomerType; label: string }[] = [
  { id: CustomerType.STANDARD, label: 'Standard' },
  { id: CustomerType.MILITARY_FR, label: 'Military & FR' },
  { id: CustomerType.PLUS_55, label: '55+' },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ currentPricing, preparedByName, preparedByNumber, discountSettings, insurancePricing, onSave, onReset, onClose }) => {
  const [editablePricing, setEditablePricing] = useState<PlanPricingData>(JSON.parse(JSON.stringify(currentPricing)));
  const [editableName, setEditableName] = useState(preparedByName);
  const [editableNumber, setEditableNumber] = useState(preparedByNumber);
  const [editableDiscounts, setEditableDiscounts] = useState(discountSettings);
  const [editableInsurance, setEditableInsurance] = useState<InsurancePricingData>(insurancePricing);
  const modalRef = useRef<HTMLDivElement>(null);
  const newPlanCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (newPlanCardRef.current) {
        newPlanCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [editablePricing]);

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
            
            if (isNaN(newMaxLines) || newMaxLines <= 0 || newMaxLines > 20) {
                return prev; // Return original state if input is invalid
            }

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
        
        return {
            ...prev,
            [planKey]: newPlanDetails,
        };
    });
  };

  const handleTaxesIncludedChange = (planKey: string, isChecked: boolean) => {
    setEditablePricing(prevPricing => {
      const newPricing = { ...prevPricing };
      const newPlanDetails = { ...newPricing[planKey] };
      newPlanDetails.taxesIncluded = isChecked;
      newPricing[planKey] = newPlanDetails;
      return newPricing;
    });
  };
  
  const handleCustomerTypeAvailabilityChange = (planKey: string, customerType: CustomerType, isChecked: boolean) => {
    setEditablePricing(prev => {
        const newPlanDetails = { ...prev[planKey] };
        let newAvailableFor = [...(newPlanDetails.availableFor || [])];

        if (isChecked) {
            if (!newAvailableFor.includes(customerType)) {
                newAvailableFor.push(customerType);
            }
        } else {
            newAvailableFor = newAvailableFor.filter(aff => aff !== customerType);
        }

        return {
            ...prev,
            [planKey]: {
                ...newPlanDetails,
                availableFor: newAvailableFor
            }
        }
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

  const handleDeletePlan = (planKeyToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete the "${editablePricing[planKeyToDelete].name}" plan? This cannot be undone.`)) {
      setEditablePricing(prev => {
        const newState = { ...prev };
        delete newState[planKeyToDelete];
        return newState;
      });
    }
  };

  const handleInsuranceChange = (tier: InsuranceTier, field: 'name' | 'price', value: string) => {
      setEditableInsurance(prev => {
          const newValue = field === 'price' ? (Number(value) || 0) : value;
          return {
              ...prev,
              [tier]: {
                  ...prev[tier],
                  [field]: newValue
              }
          }
      });
  }

  const handleSave = () => {
    onSave({ pricing: editablePricing, name: editableName, number: editableNumber, discounts: editableDiscounts, insurance: editableInsurance });
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all pricing to defaults? Any custom plans will be removed.')) {
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Admin Panel</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Quote Footer Settings</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Prepared by Name" value={editableName} onChange={(e) => setEditableName(e.target.value)} />
                  <Input label="Prepared by Number" value={editableNumber} onChange={(e) => setEditableNumber(e.target.value)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Discount Settings</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input 
                    label="AutoPay Discount per Line" 
                    type="number"
                    prefix="$" 
                    value={editableDiscounts.autopay} 
                    onChange={(e) => setEditableDiscounts(d => ({...d, autopay: Number(e.target.value) || 0}))} 
                  />
                  <Input 
                    label="Insider Code Percentage" 
                    type="number"
                    suffix="%" 
                    value={editableDiscounts.insider} 
                    onChange={(e) => setEditableDiscounts(d => ({...d, insider: Number(e.target.value) || 0}))} 
                  />
              </CardContent>
            </Card>

             <Card>
              <CardHeader><CardTitle>Insurance Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input 
                        label="Basic Plan Name"
                        value={editableInsurance.basic.name}
                        onChange={(e) => handleInsuranceChange(InsuranceTier.BASIC, 'name', e.target.value)}
                      />
                      <Input 
                        label="Basic Plan Price"
                        type="number"
                        prefix="$"
                        value={editableInsurance.basic.price}
                        onChange={(e) => handleInsuranceChange(InsuranceTier.BASIC, 'price', e.target.value)}
                      />
                  </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input 
                        label="P<360> Plan Name"
                        value={editableInsurance.p360.name}
                        onChange={(e) => handleInsuranceChange(InsuranceTier.P360, 'name', e.target.value)}
                      />
                      <Input 
                        label="P<360> Plan Price"
                        type="number"
                        prefix="$"
                        value={editableInsurance.p360.price}
                        onChange={(e) => handleInsuranceChange(InsuranceTier.P360, 'price', e.target.value)}
                      />
                  </div>
              </CardContent>
            </Card>

            <h3 className="text-md font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Plan Details</h3>
            {(Object.entries(editablePricing) as [string, PlanDetails][]).map(([planKey, planDetails], index, arr) => (
              <Card key={planKey} ref={index === arr.length - 1 ? newPlanCardRef : null}>
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                       <div className="flex-grow">
                         <Input
                              label="Plan Name"
                              type="text"
                              name={`${planKey}-name`}
                              value={planDetails.name}
                              onChange={(e) => handlePlanDetailChange(planKey, 'name', e.target.value)}
                          />
                       </div>
                        <div className="w-32 flex-shrink-0">
                            <Input
                                label="Line Limit"
                                type="number"
                                name={`${planKey}-maxLines`}
                                value={planDetails.maxLines}
                                onChange={(e) => handlePlanDetailChange(planKey, 'maxLines', e.target.value)}
                            />
                        </div>
                        <div className="pt-7">
                           <button 
                             onClick={() => handleDeletePlan(planKey)}
                             className="bg-red-500 text-white font-bold p-2.5 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-800 transition-colors"
                             aria-label="Delete Plan"
                           >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.92-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                           </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Available For</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                           {allCustomerTypes.map(ct => (
                               <label key={ct.id} className="flex items-center space-x-2 text-sm">
                                   <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-tmobile-magenta focus:ring-tmobile-magenta"
                                      checked={planDetails.availableFor?.includes(ct.id) || false}
                                      onChange={(e) => handleCustomerTypeAvailabilityChange(planKey, ct.id, e.target.checked)}
                                    />
                                    <span>{ct.label}</span>
                               </label>
                           ))}
                        </div>
                    </div>
                     <div className="mb-4">
                        <Toggle
                            label="Taxes & Fees Included"
                            description="If enabled, monthly taxes will not be calculated separately."
                            name={`${planKey}-taxesIncluded`}
                            checked={planDetails.taxesIncluded || false}
                            onChange={(e) => handleTaxesIncludedChange(planKey, e.target.checked)}
                        />
                    </div>
                    <hr className="my-4 border-slate-200 dark:border-slate-700"/>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                      {planDetails.price.map((price, index) => (
                        <Input
                          key={index}
                          label={`${index + 1} Line${index > 0 ? 's' : ''}`}
                          type="number"
                          name={`${planKey}-${index}`}
                          prefix="$"
                          value={price}
                          onChange={(e) => handlePriceChange(planKey, index, e.target.value)}
                        />
                      ))}
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 flex justify-between items-center space-x-3">
           <button 
            onClick={handleAddPlan}
            className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800 transition-colors"
           >
            + Add Plan
           </button>
           <div className="space-x-3">
              <button 
                onClick={handleReset}
                className="bg-slate-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors"
              >
                Reset to Defaults
              </button>
              <button 
                onClick={handleSave}
                className="bg-tmobile-magenta text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tmobile-magenta dark:focus:ring-offset-slate-800 transition-colors"
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