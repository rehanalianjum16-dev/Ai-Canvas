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
    try {
      console.info('[AuthProvider] Initializing auth state');
      initAuth();
      console.info('[AuthProvider] Auth initialization complete');
    } catch (error) {
      console.error('[AuthProvider] Auth initialization failed', error);
    }
  }, [initAuth]);

  useEffect(() => {
    if (!isHydrated) {
      console.info('[AuthProvider] Waiting for hydration to complete', { pathname });
      return;
    }

    const isPublicRoute = publicRoutes.includes(pathname);
    console.info('[AuthProvider] Auth state ready', {
      pathname,
      isAuthenticated,
      isPublicRoute,
      role: currentUser?.role,
    });

    if (!isAuthenticated && !isPublicRoute) {
      console.warn('[AuthProvider] Redirecting unauthenticated user to login', { pathname });
      router.push('/login');
    } else if (isAuthenticated && isPublicRoute) {
      console.info('[AuthProvider] Redirecting authenticated user away from public route', { pathname });
      router.push('/');
    } else if (pathname === '/admin' && currentUser?.role !== 'admin') {
      console.warn('[AuthProvider] Admin route blocked for non-admin user', {
        pathname,
        currentRole: currentUser?.role,
      });
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
