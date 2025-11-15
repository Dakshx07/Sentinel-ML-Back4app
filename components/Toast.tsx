import React, { useEffect, useState } from 'react';
import { XIcon, ErrorIcon, CheckIcon, InfoIcon, WarningIcon } from './icons';
import { ToastType } from '../types';

interface ToastProps {
  message: React.ReactNode;
  type: ToastType;
  onDismiss: () => void;
}

const toastConfig = {
  error: {
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    borderColor: 'border-red-500',
    textColor: 'text-red-700 dark:text-red-300',
    icon: <ErrorIcon className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />,
    title: 'An Error Occurred',
  },
  success: {
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    borderColor: 'border-green-500',
    textColor: 'text-green-700 dark:text-green-300',
    icon: <CheckIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />,
    title: 'Success',
  },
  info: {
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: <InfoIcon className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />,
    title: 'Information',
  },
  warning: {
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    icon: <WarningIcon className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0" />,
    title: 'Warning',
  },
};


const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onDismiss, 300); // Wait for animation to finish
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  const handleDismiss = () => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
  }

  const config = toastConfig[type] || toastConfig.info;

  return (
    <div 
        className={`${config.bgColor} ${config.textColor} border-l-4 ${config.borderColor} p-4 rounded-r-md shadow-lg flex items-start transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
        role="alert"
    >
      {config.icon}
      <div className="flex-grow">
        <p className="font-bold">{config.title}</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
      <button onClick={handleDismiss} className="ml-4 -mt-1 -mr-1 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;