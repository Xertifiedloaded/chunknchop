import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import StorefrontPwaPrompt from '@/components/notification/storefront-pwa-prompt';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <StorefrontPwaPrompt />
      {children}
      <Footer />
    </>
  );
}
