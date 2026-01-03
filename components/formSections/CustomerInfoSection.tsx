
import React from 'react';
import { QuoteConfig, CustomerType, CalculatedTotals } from '../../types';
import { useData } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Section from '../ui/Section';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ButtonGroup from '../ui/ButtonGroup';

interface CustomerInfoSectionProps {
  mode: 'simple' | 'full';
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
  totals: CalculatedTotals | null;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({ mode, config, setConfig, totals }) => {
  const { planPricing } = useData();
  const toCents = (dollars: number) => Math.round(dollars * 100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleCustomerTypeChange = (_name: string, value: string) => {
    const newCustomerType = value as CustomerType;
    setConfig(prev => {
        const availablePlansForNewType = planPricing.filter(plan => plan.availableFor.includes(newCustomerType)).map(plan => plan.id);
        let newPlan = prev.plan;
        let shouldResetLines = false;
        if (!availablePlansForNewType.includes(prev.plan)) {
            newPlan = availablePlansForNewType[0] || prev.plan;
            shouldResetLines = true;
        }
        return { ...prev, customerType: newCustomerType, plan: newPlan, lines: shouldResetLines ? 1 : prev.lines };
    });
  };

  const { availableFinancingLimitInCents = 0, amountToFinanceBeforeLimitInCents = 0, requiredDownPaymentInCents = 0, financedByDevicesInCents = 0, financedByAccessoriesInCents = 0, totalLinesForEC = 0 } = totals || {};
  let devicePerc = 0, accPerc = 0, overPerc = 0;
  if (availableFinancingLimitInCents > 0) {
      let usedInCents = 0;
      const deviceUsedInCents = Math.min(availableFinancingLimitInCents - usedInCents, financedByDevicesInCents);
      devicePerc = (deviceUsedInCents / availableFinancingLimitInCents) * 100;
      usedInCents += deviceUsedInCents;
      const accUsedInCents = Math.min(availableFinancingLimitInCents - usedInCents, financedByAccessoriesInCents);
      accPerc = (accUsedInCents / availableFinancingLimitInCents) * 100;
      if (amountToFinanceBeforeLimitInCents > availableFinancingLimitInCents) {
          overPerc = ((amountToFinanceBeforeLimitInCents - availableFinancingLimitInCents) / availableFinancingLimitInCents) * 100;
      }
  }
  
  const perLineTotalInCents = toCents(config.perLineEC || 0) * totalLinesForEC;
  const isCappedByMaxEC = (toCents(config.maxEC) > 0) && (toCents(config.maxEC) <= perLineTotalInCents);
  const isCappedByPerLine = !isCappedByMaxEC && ((config.perLineEC || 0) > 0 && totalLinesForEC > 0);
  const formatCurrency = (amountInCents: number) => (amountInCents / 100).toLocaleString(navigator.language, { style: 'currency', currency: 'USD' });

  if (mode === 'simple') {
    return (
      <Card>
        <CardHeader><CardTitle>Customer Type</CardTitle></CardHeader>
        <CardContent className="!pt-0">
          <ButtonGroup size="sm" name="customerType" value={config.customerType} onChange={handleCustomerTypeChange} options={[{ value: CustomerType.STANDARD, label: 'Standard' }, { value: CustomerType.MILITARY_FR, label: 'Military/FR' }, { value: CustomerType.PLUS_55, label: '55+' }]} className="grid-cols-3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Section 
        title="Customer Info"
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Customer Name" name="customerName" value={config.customerName} onChange={handleInputChange} placeholder="John Doe" />
          <Input label="Phone Number" name="customerPhone" value={config.customerPhone} onChange={handleInputChange} placeholder="(555) 123-4567" />
        </div>
        <hr className="my-2 border-border" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Input label="Max Equipment Credit" name="maxEC" type="number" value={config.maxEC} onChange={handleInputChange} prefix="$" />
           <Input label="Per Line EC" name="perLineEC" type="number" value={config.perLineEC} onChange={handleInputChange} prefix="$" />
        </div>
        {(config.maxEC > 0 || config.perLineEC > 0) && (
            <div className="mt-6 pt-6 border-t border-border space-y-3">
                 <p className="text-sm text-center text-muted-foreground">
                    {isCappedByMaxEC ? <>Your available credit is <strong>{formatCurrency(availableFinancingLimitInCents)}</strong>, capped by the account maximum.</>
                     : isCappedByPerLine ? <>Based on {totalLinesForEC} total line{totalLinesForEC !== 1 ? 's' : ''} at {formatCurrency(toCents(config.perLineEC || 0))}/line, your available credit is <strong>{formatCurrency(availableFinancingLimitInCents)}</strong>.</>
                     : <>Enter EC details to see available financing.</>}
                </p>
                <div>
                    <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-green-500" style={{ width: `${devicePerc}%` }} title={`Devices: ${formatCurrency(financedByDevicesInCents)}`}></div>
                        <div className="absolute top-0 h-full bg-purple-500" style={{ left: `${devicePerc}%`, width: `${accPerc}%` }} title={`Accessories: ${formatCurrency(financedByAccessoriesInCents)}`}></div>
                        {overPerc > 0 && <div className="absolute top-0 h-full bg-red-500" style={{ left: `${devicePerc + accPerc}%`, width: `${overPerc}%` }} title={`Over Limit: ${formatCurrency(requiredDownPaymentInCents)}`}></div>}
                    </div>
                    <div className="flex justify-between text-xs font-medium text-muted-foreground mt-1.5">
                        <span>{formatCurrency(amountToFinanceBeforeLimitInCents)} Used</span>
                        <span>{formatCurrency(availableFinancingLimitInCents)} Limit</span>
                    </div>
                </div>
                {(devicePerc > 0 || accPerc > 0) && (
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2">
                        {devicePerc > 0 && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>Devices</div>}
                        {accPerc > 0 && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>Accessories</div>}
                        {overPerc > 0 && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>Over Limit</div>}
                    </div>
                )}
                 {requiredDownPaymentInCents > 0 && (
                    <div className="!mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center text-sm">
                        <p className="font-semibold text-orange-600 dark:text-orange-400">⚠️ Financing Limit Exceeded</p>
                        <p className="text-muted-foreground">A required down payment of <strong className="text-card-foreground">{formatCurrency(requiredDownPaymentInCents)}</strong> will be added to the "Due Today" amount.</p>
                    </div>
                )}
            </div>
        )}
      </Section>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <CardTitle>Customer Type</CardTitle>
            <Select name="customerType" value={config.customerType} onChange={handleCustomerTypeChange} options={[{ value: CustomerType.STANDARD, label: 'Standard Customer' }, { value: CustomerType.MILITARY_FR, label: 'Military & FR' }, { value: CustomerType.PLUS_55, label: '55+'}]} className="w-full md:w-auto md:min-w-[240px]" />
        </CardHeader>
      </Card>
    </>
  );
};

export default CustomerInfoSection;
