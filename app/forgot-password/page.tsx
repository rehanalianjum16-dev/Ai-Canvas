"use client";

import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import Link from 'next/link';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuthStore();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const isSuccess = await resetPassword(email);
    if (isSuccess) {
      setSuccess(true);
    } else {
      setError('No account found with that email address');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reset Password</h1>
          <p className="text-slate-500 mt-1">We'll send you reset instructions</p>
        </div>
        
        <div className="p-8">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Check your email</h2>
              <p className="text-sm text-slate-500">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                  placeholder="you@example.com"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium transition-colors flex justify-center items-center gap-2"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
        
        <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Remember your password? <Link href="/login" className="text-blue-600 font-medium hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
