import Header from '@/components/sections/common/Header';
import Footer from '@/components/sections/common/Footer';
import MobileAppPromo from '@/components/sections/main/MobileApp';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-charcoal bg-white">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
