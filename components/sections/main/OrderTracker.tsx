'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePusher } from '@/lib/hooks/usePusher';
import { statusSteps } from '@/lib';

interface OrderTrackerProps {
  orderId: string;
  currentStatus: string;
}

export function OrderTracker({ orderId, currentStatus }: OrderTrackerProps) {
  const [status, setStatus] = useState(currentStatus);

  const handleStatusUpdate = useCallback((data: any) => {
    setStatus(data.status);
  }, []);

  usePusher(`order-${orderId}`, 'status-update', handleStatusUpdate);

  const currentStepIndex = statusSteps.findIndex((s) => s.key === status);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {statusSteps.map((step, index) => {
          const isComplete = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${isComplete ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className={`text-center text-sm font-medium ${isCurrent ? 'text-foreground' : isComplete ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
              {index < statusSteps.length - 1 && <div className={`mx-2 mt-4 h-1 flex-1 ${isComplete ? 'bg-accent' : 'bg-muted'}`} style={{ width: '100%' }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
