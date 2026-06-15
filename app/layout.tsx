import type { Metadata } from 'next';
import './globals.css';
import HeraldryDefs from './components/HeraldryDefs';
import TopNav from './components/TopNav';

export const metadata: Metadata = {
  title: 'Ozzy · Birmingham AI Intelligence',
  description: 'Birmingham\'s open-source AI intelligence layer — every public dataset about the city, presented so the truth shines through.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HeraldryDefs />
        <TopNav />
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
