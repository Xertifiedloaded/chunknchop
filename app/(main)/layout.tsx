
import MobileAppPromo from "@/components/sections/MobileApp";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ComingSoon from "@/components/ComingSoon";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isComingSoon = process.env.IS_COMING_SOON === "true";

  if (isComingSoon) {
    return <ComingSoon />;
  }

  return (
    <div className="text-charcoal bg-white">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
