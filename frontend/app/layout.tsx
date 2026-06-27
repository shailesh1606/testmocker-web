import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'TestMocker - Digital Mock Tests',
  description: 'AI-powered mock test platform for JEE and NEET.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-screen bg-pageBg flex flex-col`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
