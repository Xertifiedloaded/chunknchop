'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, CheckCircle, KeyRound, ShieldCheck, Users } from 'lucide-react';

import bg from '@/assets/hero.png';
import logo from '../../../assets/header-logo.svg';

type AuthMode = 'signup' | 'login' | 'forgot-password' | 'otp';

type AuthContent = {
  badgeIcon: React.ReactNode;
  badgeLabel: string;
  heading: React.ReactNode;
  description: string;
  features: string[] | null;
};

function getAuthMode(pathname: string | null): AuthMode {
  switch (true) {
    case pathname?.includes('/signup'):
      return 'signup';
    case pathname?.includes('/forgot-password'):
      return 'forgot-password';
    case pathname?.includes('/otp'):
      return 'otp';
    default:
      return 'login';
  }
}

function getAuthContent(mode: AuthMode): AuthContent {
  switch (mode) {
    case 'signup':
      return {
        badgeIcon: <Users className="text-brand" size={14} />,
        badgeLabel: 'Join Our Community',
        heading: (
          <>
            <span className="text-brand">Everything</span> you need, all in one place.
          </>
        ),
        description: 'Create your ChunkNChop account and enjoy a simple, convenient shopping experience.',
        features: ['Shop quality products with ease', 'Track and manage your orders', 'Get access to your personalized account'],
      };

    case 'login':
      return {
        badgeIcon: <CheckCircle className="text-brand" size={14} />,
        badgeLabel: 'Fresh • Premium • Delivered',
        heading: (
          <>
            Welcome back to <span className="text-brand">better</span> shopping.
          </>
        ),
        description: 'Sign in to manage your orders, save your favourite products, and enjoy a seamless ChunkNChop shopping experience.',
        features: null,
      };

    case 'forgot-password':
      return {
        badgeIcon: <KeyRound className="text-brand" size={14} />,
        badgeLabel: 'Account Recovery',
        heading: (
          <>
            Let&apos;s get you <span className="text-brand">back in</span>.
          </>
        ),
        description: 'It happens to the best of us. Enter your email and we\u2019ll send you a code to reset your password.',
        features: null,
      };

    case 'otp':
      return {
        badgeIcon: <ShieldCheck className="text-brand" size={14} />,
        badgeLabel: 'Verify It\u2019s You',
        heading: (
          <>
            Just one <span className="text-brand">quick check</span>.
          </>
        ),
        description: 'Enter the code we sent you to confirm it\u2019s really you and keep your account secure.',
        features: null,
      };
  }
}

function AuthBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur">
      {icon}
      <span>{label}</span>
    </span>
  );
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <div className="font-sora my-8 space-y-3">
      {features.map((feature) => (
        <div key={feature}>
          <span className="inline-flex items-center gap-2 rounded-full text-white">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Check className="text-white" size={10} />
            </div>
            <span className="text-sm">{feature}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function AuthHeroPanel({ content }: { content: AuthContent }) {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <Image src={bg} alt="ChunkNChop" fill priority className="object-cover" />

      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_40%)]" />

      <div className="relative z-10 flex h-full flex-col p-10 xl:p-16">
        <div className="flex flex-1 items-center">
          <div className="max-w-xl">
            <AuthBadge icon={content.badgeIcon} label={content.badgeLabel} />

            <h1 className="font-sora text-4xl font-bold text-white xl:text-5xl">{content.heading}</h1>

            <p className="text-sand font-worksans mt-4 max-w-lg text-sm">{content.description}</p>

            {content.features && <FeatureList features={content.features} />}
          </div>
        </div>

        <p className="text-sm text-white/60">© {new Date().getFullYear()} ChunkNChop. All rights reserved.</p>
      </div>
    </div>
  );
}

function AuthFormPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-[#F3F4F6] bg-white p-6 text-black shadow-xl sm:p-8">
          <Link href="/" className="mb-4 flex items-center justify-center">
            <Image src={logo} alt="ChunkNChop" priority className="h-auto w-24 sm:w-24" />
          </Link>
          <div>{children}</div>
        </div>

        <p className="text-muted-foreground sr-only mt-6 text-center text-xs lg:hidden">© {new Date().getFullYear()} ChunkNChop. All rights reserved.</p>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = getAuthMode(pathname);
  const content = getAuthContent(mode);

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthHeroPanel content={content} />
        <AuthFormPanel>{children}</AuthFormPanel>
      </div>
    </main>
  );
}
