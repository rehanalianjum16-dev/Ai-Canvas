"use client";

import React from 'react';
import { useToastStore } from '../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let bgClass = 'bg-slate-800';
        let textClass = 'text-white';
        let iconClass = 'text-slate-400';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          bgClass = 'bg-white border border-green-200';
          textClass = 'text-slate-800';
          iconClass = 'text-green-500';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          bgClass = 'bg-white border border-red-200';
          textClass = 'text-slate-800';
          iconClass = 'text-red-500';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          bgClass = 'bg-white border border-amber-200';
          textClass = 'text-slate-800';
          iconClass = 'text-amber-500';
        } else {
          Icon = Info;
          bgClass = 'bg-white border border-blue-200';
          textClass = 'text-slate-800';
          iconClass = 'text-blue-500';
        }

        return (
          <div 
            key={toast.id} 
            className={`${bgClass} ${textClass} shadow-lg rounded-lg p-3 flex items-start gap-3 w-80 pointer-events-auto transition-all transform origin-bottom animate-in slide-in-from-bottom-5 fade-in duration-300`}
          >
            <Icon size={18} className={`${iconClass} mt-0.5 shrink-0`} />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
