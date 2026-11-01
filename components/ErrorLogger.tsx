'use client';

import { useEffect } from 'react';

export default function ErrorLogger() {
  useEffect(() => {
    const logRuntimeError = (source: string, error?: unknown, extra?: Record<string, unknown>) => {
      const payload = {
        source,
        message: error instanceof Error ? error.message : String(error ?? 'Unknown error'),
        stack: error instanceof Error ? error.stack : undefined,
        ...(extra ?? {}),
      };

      console.error('[App runtime error]', payload);
    };

    const handleWindowError = (event: ErrorEvent) => {
      logRuntimeError('window.error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logRuntimeError('unhandledrejection', event.reason, {
        promise: 'Promise rejected without a handler',
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
