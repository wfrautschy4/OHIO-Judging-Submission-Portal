import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NotificationBannerProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex items-center p-4 mb-4 text-sm rounded-lg shadow-xl min-w-[320px] max-w-md animate-in slide-in-from-top-2 fade-in duration-300 ${
      type === 'success' ? 'text-green-800 bg-green-50 border border-green-200' : 'text-red-800 bg-red-50 border border-red-200'
    }`} role="alert">
      <div className="flex-shrink-0">
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600" />
        )}
      </div>
      <div className="ml-3 font-semibold mr-2">
        {message}
      </div>
      <button 
        onClick={onClose} 
        className={`ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 transition-colors ${
           type === 'success' ? 'hover:bg-green-200 text-green-500' : 'hover:bg-red-200 text-red-500'
        }`}
      >
        <X size={18} />
      </button>
    </div>
  );
};
