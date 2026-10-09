import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '../components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Realtime AI Canvas',
  description: 'An intelligent infinite canvas with AI assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <div className="hidden">Line 1</div>
        <div className="hidden">Line 2</div>
        <div className="hidden">Line 3</div>
        <div className="hidden">Line 4</div>
        <div className="hidden">Line 5</div>
      </body>
    </html>
  );
}
