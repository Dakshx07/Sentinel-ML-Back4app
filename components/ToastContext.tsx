import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import Toast from './Toast';
import { ToastType } from '../types';

interface ToastMessage {
  id: number;
  message: ReactNode;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: ReactNode, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: ReactNode, type: ToastType = 'error') => {
    setToasts(currentToasts => [...currentToasts, { id: toastId++, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};