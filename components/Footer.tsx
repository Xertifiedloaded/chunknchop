'use client';
import Image from 'next/image';
import logo from '../assets/logo.svg';
const SOCIALS = [
  {
    href: '#',
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-black">
        <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.87.24-1.46 1.5-1.46h1.6V4.35C16.3 4.24 15.4 4.13 14.34 4.13c-2.44 0-4.11 1.49-4.11 4.22V10.5H7.6v3h2.63V21h3.27z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'X',
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-black">
        <path d="M18.9 3H22l-7.2 8.2L23.3 21H16l-5.1-6.6L5 21H1.9l7.7-8.8L1 3h7.3l4.6 6.1L18.9 3zm-1.2 16h1.7L7.4 4.9H5.6L17.7 19z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-black">
        <path d="M6.94 5.5a1.94 1.94 0 11-3.88 0 1.94 1.94 0 013.88 0zM3.5 8.75h3.4V21h-3.4V8.75zM9.9 8.75h3.26v1.68h.05c.45-.86 1.56-1.77 3.22-1.77 3.44 0 4.08 2.27 4.08 5.22V21h-3.4v-6.24c0-1.49-.03-3.4-2.07-3.4-2.08 0-2.4 1.62-2.4 3.3V21H9.9V8.75z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-black">
        <path d="M12 2c-2.72 0-3.06.01-4.12.06-1.06.05-1.79.22-2.43.47a4.9 4.9 0 00-1.77 1.15A4.9 4.9 0 002.53 5.45c-.25.64-.42 1.37-.47 2.43C2.01 8.94 2 9.28 2 12s.01 3.06.06 4.12c.05 1.06.22 1.79.47 2.43a4.9 4.9 0 001.15 1.77 4.9 4.9 0 001.77 1.15c.64.25 1.37.42 2.43.47C8.94 21.99 9.28 22 12 22s3.06-.01 4.12-.06c1.06-.05 1.79-.22 2.43-.47a4.9 4.9 0 001.77-1.15 4.9 4.9 0 001.15-1.77c.25-.64.42-1.37.47-2.43.05-1.06.06-1.4.06-4.12s-.01-3.06-.06-4.12c-.05-1.06-.22-1.79-.47-2.43a4.9 4.9 0 00-1.15-1.77A4.9 4.9 0 0018.55 2.53c-.64-.25-1.37-.42-2.43-.47C15.06 2.01 14.72 2 12 2zm0 1.8c2.67 0 2.99.01 4.04.06.98.04 1.5.21 1.86.35.47.18.8.4 1.15.75.35.35.57.68.75 1.15.14.36.31.88.35 1.86.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.04.98-.21 1.5-.35 1.86-.18.47-.4.8-.75 1.15-.35.35-.68.57-1.15.75-.36.14-.88.31-1.86.35-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-.98-.04-1.5-.21-1.86-.35a3.1 3.1 0 01-1.15-.75 3.1 3.1 0 01-.75-1.15c-.14-.36-.31-.88-.35-1.86C3.81 14.99 3.8 14.67 3.8 12s.01-2.99.06-4.04c.04-.98.21-1.5.35-1.86.18-.47.4-.8.75-1.15.35-.35.68-.57 1.15-.75.36-.14.88-.31 1.86-.35C9.01 3.81 9.33 3.8 12 3.8zm0 3.05a5.15 5.15 0 100 10.3 5.15 5.15 0 000-10.3zm0 8.5a3.35 3.35 0 110-6.7 3.35 3.35 0 010 6.7zm5.35-8.7a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
      </svg>
    ),
  },
];

const FOOTER_COLUMNS = [
  {
    title: 'Company',
    links: ['About', 'Careers', 'Press', 'Contact'],
  },
  {
    title: 'Shop',
    links: ['Categories', 'Bestsellers', 'BBQ Packs', 'Subscription'],
  },
  {
    title: 'Explore',
    links: ['Recipes', 'Wholesale', 'Delivery Areas', 'FAQs'],
  },
  {
    title: 'Legal',
    links: ['Privacy', 'Terms', 'Cookies'],
  },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#1A1614]">
      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-7">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Image
              width={200}
              height={100}
              className="h-auto w-32 object-contain"
              src={logo}
              alt="ChunkNChop Logo"
            />
            <p className="mt-4  text-sm leading-relaxed text-neutral-400">
              Premium meat, expertly portioned and delivered fresh across Lagos.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="lg:col-span-1">
              <p className="text-sm font-bold text-white">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-neutral-400 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-1">
            <p className="text-sm font-bold text-white">Follow us</p>
            <div className="mt-4 flex flex-nowrap gap-2.5">
              {SOCIALS.map(({ icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white transition-opacity hover:opacity-80"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 py-6 text-center">
          <p className="text-xs text-neutral-500">© 2026 ChunkNChop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
