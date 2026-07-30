import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fairytale IdeaPiece',
  description: '만 3세 맞춤형 인터랙티브 동화 웹서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
