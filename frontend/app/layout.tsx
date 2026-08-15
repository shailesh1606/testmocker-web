import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { AuthProvider } from '@/context/AuthContext';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'TestMocker - Digital Mock Tests',
  description: 'AI-powered mock test platform for JEE and NEET.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get('auth_token')?.value;
  let initialUser = null;

  if (token) {
    try {
      const apiBase = process.env.API_URL || "http://backend:8000";
      const res = await fetch(`${apiBase}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });
      if (res.ok) {
        initialUser = await res.json();
      }
    } catch (e) {
      console.error("Failed to prefetch user in layout", e);
    }
  }

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-screen bg-pageBg flex flex-col`}>
        <ToastProvider>
          <AuthProvider initialUser={initialUser}>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
