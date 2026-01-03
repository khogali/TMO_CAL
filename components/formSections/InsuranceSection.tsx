import React from 'react';
import { QuoteConfig, Device } from '../../types';
import { useData } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface InsuranceSectionProps {
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
}

const InsuranceSection: React.FC<InsuranceSectionProps> = ({ config, setConfig }) => {
  const { insurancePlans, deviceDatabase } = useData();

  // Helper to count covered devices
  const coveredDevices = (config.devices || []).filter(d => !!d.insuranceId);
  // Unprotected: Has no insurance AND (has a model selected OR is marked as BYOD)
  const unprotectedDevices = (config.devices || []).filter(d => !d.insuranceId && (d.modelId || d.isByod));

  const getInsuranceName = (id: string | undefined) => {
      const plan = insurancePlans.find(p => p.id === id);
      return plan ? plan.name : 'Unknown Plan';
  }

  const getDeviceName = (device: Device) => {
      if (device.isByod) return `BYOD ${device.category}`;
      const model = deviceDatabase.devices.find(d => d.id === device.modelId);
      return model ? model.name : 'Unknown Device';
  }

  // Quick apply logic: Find the best insurance for each unprotected device
  const handleQuickApply = () => {
      setConfig(prev => {
          const updatedDevices = prev.devices.map(d => {
              if (d.insuranceId || (!d.modelId && !d.isByod)) return d; 
              
              // Find first applicable plan (usually P360)
              // For BYOD, we use the device category directly. For modeled devices, we use the model's category.
              let category = d.category;
              if (!d.isByod && d.modelId) {
                  const model = deviceDatabase.devices.find(m => m.id === d.modelId);
                  if (model) category = model.category;
              }

              const plan = insurancePlans.find(p => 
                  p.name.includes('P360') && // Prefer P360
                  (!p.supportedCategories || p.supportedCategories.includes(category))
              );
              
              return plan ? { ...d, insuranceId: plan.id } : d;
          });
          return { ...prev, devices: updatedDevices };
      });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
            <CardTitle>Insurance Protection</CardTitle>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">
                {coveredDevices.length}/{config.devices.length} Protected
            </span>
        </div>
        {unprotectedDevices.length > 0 && (
            <button 
                onClick={handleQuickApply} 
                className="text-sm font-semibold text-primary hover:underline"
            >
                Auto-protect Remaining
            </button>
        )}
      </CardHeader>
      <CardContent>
        {config.devices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">Add devices to configure protection.</p>
        ) : (
            <div className="space-y-3">
                {config.devices.map((device, idx) => (
                    <div key={device.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{getDeviceName(device)}</span>
                            <span className="text-muted-foreground text-xs">(Device {idx + 1})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {device.insuranceId ? (
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    {getInsuranceName(device.insuranceId)}
                                </span>
                            ) : (
                                <span className="text-amber-600 font-medium flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    No Protection
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsuranceSection;
