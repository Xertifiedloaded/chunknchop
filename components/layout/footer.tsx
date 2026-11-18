import Link from 'next/link';

const shopLinks = [
  { label: 'BEEF', href: '/shop?category=beef' },
  { label: 'GOAT & LAMB', href: '/shop?category=goat-lamb' },
  { label: 'CHICKEN', href: '/shop?category=chicken' },
  { label: 'MEATBOX', href: '/shop?category=meatbox' },
];

const helpLinks = [
  { label: 'Delivery Information', href: '/delivery-info' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'About Us', href: '/about' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0f0b0a] px-6 py-12 ">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 lg:grid-cols-4">
        {}
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" className="inline-block font-black tracking-[-1px] text-white">
            ChunkN <span className="text-[#b9aaa0]">CHOP</span>
          </Link>

          <p className="mt-3 max-w-[220px] text-xs leading-relaxed text-[#9b8e83]">
            Fresh meat, cut to order and delivered cold.
          </p>
        </div>

        {}
        <div>
          <h3 className="text-xs font-bold tracking-[1px] text-[#a99b90]">SHOP</h3>

          <div className="mt-4 space-y-3">
            {shopLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block text-xs text-[#9b8e83] transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {}
        <div>
          <h3 className="text-xs font-bold tracking-[1px] text-[#a99b90]">HELP</h3>

          <div className="mt-4 space-y-3">
            {helpLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block text-xs text-[#9b8e83] transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {}
        <div>
          <h3 className="text-xs font-bold tracking-[1px] text-[#a99b90]">CONTACT</h3>

          <div className="mt-4 space-y-3 text-xs text-[#9b8e83]">
            <a href="tel:+2340000000000" className="block transition hover:text-white">
              [PHONE]
            </a>

            <a
              href="mailto:hello@chunknchop.com"
              className="block break-all transition hover:text-white"
            >
              [EMAIL]
            </a>

            <Link href="/contact" className="inline-block transition hover:text-white">
              Customer Support
            </Link>
          </div>
        </div>
      </div>

      {}
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-white/5 pt-5 text-center text-[10px] text-[#6c615a] sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p>© {new Date().getFullYear()} ChunkNChop. All rights reserved.</p>

        <div className="flex items-center justify-center gap-5">
          <Link href="/privacy" className="transition hover:text-white">
            Privacy Policy
          </Link>

          <Link href="/terms" className="transition hover:text-white">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
