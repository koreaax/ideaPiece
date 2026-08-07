import type { Metadata, Viewport } from 'next';
import './globals.css';
import SwRegister from '../components/sw-register';
import ReminderScheduler from '../components/reminder-scheduler';

export const metadata: Metadata = {
  title: 'Fairytale IdeaPiece',
  description: '만 3세 맞춤형 인터랙티브 동화 웹서비스',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IdeaPiece',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#2f855a',
  width: 'device-width',
  initialScale: 1,
};

import { SupabaseProvider } from '../contexts/supabase-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SupabaseProvider>
          {children}
          <SwRegister />
          <ReminderScheduler />
        </SupabaseProvider>
      </body>
    </html>
  );
}
