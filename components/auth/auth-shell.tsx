import type { ReactNode } from 'react';
import Link from 'next/link';

type AuthShellProps = {
  children: ReactNode;
  mode?: 'sign-in' | 'sign-up' | 'verify' | 'reset' | 'forgot';
};

export default function AuthShell({ children, mode = 'sign-in' }: AuthShellProps) {
  const heroContent = {
    'sign-in': {
      title: 'Welcome back to',
      highlight: 'better',
      ending: ' shopping.',
      description:
        'Sign in to manage your orders, save your favorite products, and enjoy a seamless ChunkNChop shopping experience.',
    },
    'sign-up': {
      title: 'Everything',
      highlight: 'you need,',
      ending: ' all in one place.',
      description:
        'Create your ChunkNChop account and enjoy a simple, convenient shopping experience.',
    },
    verify: {
      title: 'One more step to',
      highlight: 'get',
      ending: ' started.',
      description:
        'Verify your email address and enjoy quality products delivered with convenience.',
    },
    reset: {
      title: 'A fresh start to',
      highlight: 'better',
      ending: ' shopping.',
      description: 'Secure your account with a new password and continue enjoying ChunkNChop.',
    },
    forgot: {
      title: 'Your account is',
      highlight: 'always',
      ending: ' within reach.',
      description: 'We will help you securely regain access to your ChunkNChop account.',
    },
  }[mode];

  return (
    <main className="min-h-screen bg-[#f5f5f5] ">
      <div className="mx-auto flex min-h-[calc(100vh-16px)] max-w-[1600px] overflow-hidden bg-white shadow-sm sm:min-h-[calc(100vh)] md:min-h-[calc(100vh)]">
        {}
        <section
          className="relative hidden w-1/2 overflow-hidden bg-cover bg-center lg:flex"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1400&q=85')",
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-black/30" />

          <div className="relative z-10 flex w-full flex-col justify-center px-8 py-12 xl:px-12 2xl:px-16">
            <div className="mb-9 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/15 px-3 py-1.5 backdrop-blur-md">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white">
                ✓
              </span>
              <span className="text-[9px] font-medium text-white">Fresh. Quality. Delivered.</span>
            </div>

            <h1 className="max-w-120 text-[34px] font-extrabold leading-[1.17] tracking-tight text-white xl:text-[42px]">
              {heroContent.title} <span className="text-brand">{heroContent.highlight}</span>
              {heroContent.ending}
            </h1>

            <p className="mt-5 max-w-105 text-[13px] leading-6 text-white/85">
              {heroContent.description}
            </p>

            <div className="mt-8 space-y-3 text-[11px] text-white/85">
              {[
                'Shop quality products with ease',
                'Track and manage your orders',
                'Enjoy a personalized shopping experience',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-12">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-white/50">CHUNKNCHOP</p>
              <p className="mt-1 text-[10px] italic text-brand">
                Premium Quality. Expertly Portioned.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[calc(100vh-16px)] w-full items-center justify-center bg-white px-5 py-10 sm:px-8 lg:min-h-0 lg:w-1/2 lg:px-10 xl:px-16">
          <div className="w-full max-w-110">
            <div className="mb-6 flex justify-center lg:hidden">
              <BrandLogo />
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function BrandLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path d="M4 20 8 19 19 8a2.8 2.8 0 0 0-4-4L4 15l-1 5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </span>

      <span className="text-[15px] font-extrabold tracking-tight text-[#202331]">
        Chunk<span className="text-[#a31635]">N</span>Chop
      </span>
    </Link>
  );
}
