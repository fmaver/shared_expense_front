import React, { useEffect } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg animate-slide-up z-50"
         style={{ backgroundColor: type === 'success' ? '#10B981' : '#EF4444' }}>
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 text-white" />
      ) : (
        <XCircle className="h-5 w-5 text-white" />
      )}
      <span className="text-white font-medium">{message}</span>
    </div>
  );
}
