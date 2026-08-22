"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';

const publicRoutes = ['/login', '/signup', '/forgot-password'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initAuth, isHydrated, isAuthenticated, currentUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isHydrated) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    } else if (isAuthenticated && isPublicRoute) {
      router.push('/');
    } else if (pathname === '/admin' && currentUser?.role !== 'admin') {
      router.push('/');
    }
  }, [isHydrated, isAuthenticated, pathname, router, currentUser]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Prevent flash of protected content before redirect
  if (!isAuthenticated && !publicRoutes.includes(pathname)) return null;
  if (pathname === '/admin' && currentUser?.role !== 'admin') return null;

  return <>{children}</>;
}
