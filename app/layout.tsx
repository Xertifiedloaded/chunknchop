import { Analytics } from '@vercel/analytics/next';
import { Anton, Inter, Sora, Work_Sans } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { CartProvider } from '@/components/cart/cart-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});
export const metadata: Metadata = {
  title: "ChunkNChop | Premium Meat Delivery in Lagos",
  description: "Certified, hygienically processed livestock products delivered fresh across Lagos.",
  icons: {
    icon: "./chunkNchop.png",
  },
};


export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: 'white',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${sora.variable} ${workSans.variable} ${anton.variable} antialiased`}
      >
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
