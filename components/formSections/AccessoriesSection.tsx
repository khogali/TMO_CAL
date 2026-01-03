import React from 'react';
import { QuoteConfig, Accessory, AccessoryPaymentType, CalculatedTotals } from '../../types';
import { Card, CardHeader, CardContent } from '../ui/Card';
import Section from '../ui/Section';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ButtonGroup from '../ui/ButtonGroup';

interface AccessoriesSectionProps {
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
  totals: CalculatedTotals | null;
}

const AccessoriesSection: React.FC<AccessoriesSectionProps> = ({ config, setConfig, totals }) => {
  const { availableFinancingLimitInCents = 0, financedByDevicesInCents = 0 } = totals || {};

  const handleAddAccessory = () => setConfig(prev => ({ ...prev, accessories: [...(prev.accessories || []), { id: crypto.randomUUID(), name: '', price: 0, paymentType: AccessoryPaymentType.FULL, quantity: 1, term: 12, downPayment: 0 }] }));
  const handleRemoveAccessory = (id: string) => setConfig(prev => ({ ...prev, accessories: prev.accessories.filter(acc => acc.id !== id) }));
  const handleAccessoryChange = (id: string, field: keyof Accessory, value: string | AccessoryPaymentType) => {
      setConfig(prev => ({ ...prev, accessories: prev.accessories.map(acc => acc.id === id ? { ...acc, [field]: (['price', 'downPayment', 'term', 'quantity'].includes(field)) ? Number(value) : value } : acc) }));
  };
  const handleAccessoryQuantityChange = (id: string, increment: number) => {
      setConfig(prev => ({ ...prev, accessories: prev.accessories.map(acc => acc.id === id ? { ...acc, quantity: Math.max(1, (acc.quantity || 1) + increment) } : acc) }));
  };

  return (
    <Section title="Accessories" defaultOpen={false} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}>
      <div className="space-y-4">
        {(config.accessories || []).map((accessory) => {
          const isFinancingDisabled = financedByDevicesInCents >= availableFinancingLimitInCents;
          return (
            <Card key={accessory.id} className="overflow-hidden">
              <CardHeader className="flex justify-between items-center bg-muted/50 p-4">
                <div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-muted-foreground"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg><p className="font-semibold text-foreground">Accessory Details</p></div>
                <button type="button" onClick={() => handleRemoveAccessory(accessory.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10" aria-label={`Remove Accessory`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Accessory Name" type="text" name={`acc-name-${accessory.id}`} value={accessory.name} onChange={(e) => handleAccessoryChange(accessory.id, 'name', e.target.value)} placeholder="e.g. Case, Charger" />
                  <Input label="Total Price" type="number" name={`acc-price-${accessory.id}`} value={accessory.price} onChange={(e) => handleAccessoryChange(accessory.id, 'price', e.target.value)} prefix="$" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <ButtonGroup label="Payment Option" name={`accessory-payment-${accessory.id}`} value={accessory.paymentType} onChange={(_, v) => handleAccessoryChange(accessory.id, 'paymentType', v as AccessoryPaymentType)} options={[{ value: AccessoryPaymentType.FULL, label: 'Pay in Full' }, { value: AccessoryPaymentType.FINANCED, label: 'Finance', disabled: isFinancingDisabled }]} className="grid-cols-2" />
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Quantity</label>
                    <div className="flex items-center justify-between w-full h-12 rounded-xl bg-muted px-2">
                      <button type="button" onClick={() => handleAccessoryQuantityChange(accessory.id, -1)} disabled={(accessory.quantity || 1) <= 1} className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-border disabled:opacity-50" aria-label="Decrease quantity"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg></button>
                      <div className="text-center font-bold text-lg text-foreground w-12">{accessory.quantity || 1}</div>
                      <button type="button" onClick={() => handleAccessoryQuantityChange(accessory.id, 1)} className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-border" aria-label="Increase quantity"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg></button>
                    </div>
                  </div>
                </div>
                {accessory.paymentType === AccessoryPaymentType.FINANCED && (
                  <><hr className="border-border/50" /><div>
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Financing Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select label="Financing Term" name={`accessory-term-${accessory.id}`} value={String(accessory.term)} onChange={(_, v) => handleAccessoryChange(accessory.id, 'term', v)} options={[{ value: '12', label: '12 Months' }, { value: '24', label: '24 Months' }]} />
                      <Input label="Optional Down Payment" type="number" name={`acc-downPayment-${accessory.id}`} value={accessory.downPayment} onChange={(e) => handleAccessoryChange(accessory.id, 'downPayment', e.target.value)} prefix="$" />
                    </div>
                  </div></>
                )}
              </CardContent>
            </Card>
          )
        })}
        <button type="button" onClick={handleAddAccessory} className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg><span className="font-semibold">Add Accessory</span></button>
      </div>
    </Section>
  );
};

export default AccessoriesSection;
