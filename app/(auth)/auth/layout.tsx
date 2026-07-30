import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import bg from '@/assets/hero.png';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className=" bg-white text-black min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          <Image
            src={bg}
            alt="ChunkNChop"
            fill
            priority
            className="object-cover"
          />

          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_40%)]" />

          <div className="relative z-10 flex h-full flex-col p-10 xl:p-16">
            <div className="flex flex-1 items-center">
              <div className="max-w-xl">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur">
                  <CheckCircle className="text-brand" size={14} />
                  <span>Fresh • Premium • Delivered</span>
                </span>

                <h1 className="text-4xl font-bold leading-tight text-white xl:text-6xl">
                  Welcome back to <span className="text-brand">better</span> shopping.
                </h1>

                <p className="mt-6 max-w-lg text-base text-sand ">
                  Sign in to manage your orders, save your favourite products,
                  and enjoy a seamless ChunkNChop shopping experience.
                </p>
              </div>
            </div>

            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} ChunkNChop. All rights reserved.
            </p>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <Link href="/" className="text-3xl font-bold tracking-tight">
                Chunk<span className="text-brand">N</span>Chop
              </Link>
            </div>

            <div className="bg-white text-black rounded-3xl border border-[#F3F4F6] p-6 shadow-xl sm:p-8">{children}</div>

            <p className="text-muted-foreground mt-6 text-center text-xs lg:hidden">© {new Date().getFullYear()} ChunkNChop. All rights reserved.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
