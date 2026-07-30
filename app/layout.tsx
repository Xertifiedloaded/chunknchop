import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Sora, Inter, Work_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/sections/common/Header';
import Footer from '@/components/sections/common/Footer';
import MobileAppPromo from '@/components/sections/main/MobileApp';
import { ScrollToTop } from '@/lib/scroll';
import { Toaster } from 'react-hot-toast';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
});

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
    <html lang="en" className={` ${sora.variable} ${inter.variable} ${workSans.variable}`}>
      <body className="antialiased">
        <Toaster />
        <ScrollToTop />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
