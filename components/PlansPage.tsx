
import React, { useState } from 'react';
import { useData } from '../context/AppContext';
import MobileAppShell from './ui/MobileAppShell';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { CustomerType, PlanDetails } from '../types';

const PlansPage: React.FC = () => {
    const { planPricing } = useData();
    const [selectedType, setSelectedType] = useState<CustomerType>(CustomerType.STANDARD);
    const [includeTaxes, setIncludeTaxes] = useState(false);
    const [taxRate, setTaxRate] = useState(6);

    const filteredPlans = planPricing.filter(plan => plan.availableFor.includes(selectedType));

    const getPrice = (price: number) => {
        if (includeTaxes) {
            return Math.round(price * (1 + (taxRate / 100)));
        }
        return price;
    };

    return (
        <MobileAppShell>
            <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-20 pt-4 pb-2">
                <div className="px-5 mb-3 flex justify-between items-center">
                    <h1 className="text-xl font-black text-foreground tracking-tight">Rate Plans</h1>
                    
                    <div className="flex items-center gap-3">
                        {includeTaxes && (
                            <div className="flex items-center gap-1 bg-card border border-border/60 rounded-lg px-2 h-7 animate-fade-in-down shadow-sm">
                                <input 
                                    type="number" 
                                    className="w-7 bg-transparent text-right font-bold text-sm outline-none p-0 appearance-none text-foreground"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(Number(e.target.value))}
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                    min="0"
                                    max="50"
                                />
                                <span className="text-xs text-muted-foreground font-medium">%</span>
                            </div>
                        )}

                        {/* Tax Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline-block">
                                {includeTaxes ? 'Tax Included' : 'Tax Excluded'}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground sm:hidden">
                                {includeTaxes ? 'Tax' : 'No Tax'}
                            </span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={includeTaxes} 
                                    onChange={(e) => setIncludeTaxes(e.target.checked)} 
                                />
                                <div className={`w-9 h-5 rounded-full shadow-inner transition-colors ${includeTaxes ? 'bg-primary' : 'bg-muted-foreground/30'}`}></div>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${includeTaxes ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
                
                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-3">
                    {Object.values(CustomerType).map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`
                                px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border
                                ${selectedType === type 
                                    ? 'bg-primary text-white border-primary shadow-md' 
                                    : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                                }
                            `}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 space-y-4 pb-40 overflow-y-auto">
                {filteredPlans.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No plans found for {selectedType}.</p>
                    </div>
                ) : (
                    filteredPlans.map(plan => (
                        <Card key={plan.id}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                                    {includeTaxes ? (
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                                            +{taxRate}% Tax
                                        </span>
                                    ) : plan.taxesIncluded ? (
                                        <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                            Tax Inc.
                                        </span>
                                    ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                    Max {plan.maxLines} Lines • {plan.pricingModel}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {plan.pricingModel === 'Tiered' ? (
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            {plan.tieredPrices?.map((price, i) => {
                                                const currentPrice = getPrice(price);
                                                const prevPrice = i > 0 ? getPrice(plan.tieredPrices![i - 1]) : 0;
                                                const diff = currentPrice - prevPrice;
                                                
                                                return (
                                                    <div key={i} className="bg-muted/50 rounded-lg p-2 border border-border/50 flex flex-col justify-between h-full">
                                                        <div className="text-[10px] text-muted-foreground font-medium mb-1">{i + 1} Line{i > 0 ? 's' : ''}</div>
                                                        <div className={`font-black text-lg leading-none ${includeTaxes ? 'text-amber-600 dark:text-amber-500' : 'text-foreground'}`}>
                                                            ${currentPrice}
                                                        </div>
                                                        {i > 0 ? (
                                                            <div className="text-[10px] font-semibold text-muted-foreground mt-1 bg-background/50 rounded px-1">
                                                                {diff === 0 ? 'Free' : `+ $${diff}`}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] text-transparent mt-1 select-none">.</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center bg-muted/50 rounded-lg p-3 border border-border/50">
                                            <div>
                                                <div className="text-xs text-muted-foreground font-medium">Line 1</div>
                                                <div className={`font-black text-lg ${includeTaxes ? 'text-amber-600 dark:text-amber-500' : 'text-foreground'}`}>
                                                    ${getPrice(plan.firstLinePrice || 0)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground font-medium">Add'l Lines</div>
                                                <div className={`font-black text-lg ${includeTaxes ? 'text-amber-600 dark:text-amber-500' : 'text-foreground'}`}>
                                                    +${getPrice(plan.additionalLinePrice || 0)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </MobileAppShell>
    );
};

export default PlansPage;
