import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Birmingham — Employment Deprivation · BCC Intelligence Dashboard',
  description: 'Employment deprivation intelligence across 68 Birmingham wards — IMD 2025, NOMIS claimant count, Census 2021, GVA 2022.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
