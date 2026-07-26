import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileAppPromo from '@/components/MobileApp';

export const metadata: Metadata = {
  title: 'ChunkNChop | Premium Meat Delivery in Lagos',
  description: 'Certified, hygienically processed livestock products delivered fresh across Lagos.',
  icons: {
    icon: './chunkNchop.png',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        <Header />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <MobileAppPromo />
        <Footer />
      </body>
    </html>
  );
}
