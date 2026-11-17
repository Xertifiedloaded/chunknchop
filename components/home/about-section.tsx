import Link from 'next/link';
import { Check } from 'lucide-react';

const container = 'mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12';
const buttonClass =
  'inline-flex w-full items-center justify-center bg-[#1c1c1c] px-6 py-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand sm:w-auto';

const features = [
  {
    title: 'Certified Quality',
    description:
      'Every cut is processed under strict hygiene and food safety standards, ensuring premium quality you can trust.',
  },
  {
    title: 'Cold Chain Freshness',
    description:
      'Our temperature-controlled storage and delivery system keeps every product fresh from processing to your doorstep.',
  },
  {
    title: 'Expertly Portioned',
    description:
      'Professionally trimmed, portioned, and vacuum-sealed for convenience, freshness, and less kitchen prep.',
  },
  {
    title: 'Convenient Delivery',
    description:
      'Order online and enjoy fast, reliable delivery or pick up your order at one of our retail locations.',
  },
  {
    title: 'Wide Product Selection',
    description:
      'From premium beef, chicken, seafood, and goat meat to BBQ packs, sausages, dairy products, and everyday kitchen essentials.',
  },
  {
    title: 'Trusted by Families',
    description:
      'We help households, restaurants, and food businesses enjoy safe, consistent, and premium-quality meat every day.',
  },
];

export default function AboutSection() {
  return (
    <div className="w-full">
      <section className="bg-[#faf9f6] py-10">
        <div
          className={`${container} grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16`}
        >
          <div>
            <p className="mb-3 flex items-center gap-2.5 font-worksans text-[11px] font-bold tracking-[0.15em] text-[#77736d]">
              <span className="h-px w-5 bg-brand" />
              ABOUT CHUNKNCHOP
            </p>

            <h2 className="max-w-[560px] text-[clamp(34px,4.5vw,54px)] leading-[1.05] font-normal tracking-[-0.05em] text-[#1c1c1c]">
              Premium Quality.
              <br />
              <em className="font-he font-normal text-brand">Expertly</em> Portioned.
            </h2>

            <div className="mt-6 max-w-[560px] space-y-3 text-[13px] leading-[1.8] text-[#77736d] sm:text-sm">
              <p>
                At ChunkNChop, we’re committed to changing the way Nigerians buy livestock products
                by delivering safer, fresher, and expertly prepared.
              </p>

              <p>
                We source our livestock responsibly, process every cut under strict hygiene
                standards, and expertly portion and package each product to preserve freshness from
                farm to table. Whether you&apos;re shopping online or visiting one of our retail
                locations, every product is prepared with the care, safety, and quality your family
                deserves.
              </p>

              <p>Because we believe great meals begin with trusted ingredients.</p>

              <p className="font-bold text-brand">Every Cut Certified. Every Meal Better.</p>
            </div>

            <div className="mt-8">
              <Link href="/about" className={buttonClass}>
                Learn More About Us
              </Link>
            </div>
          </div>

          <div className="overflow-hidden">
            <img
              src="https://mosshammer.at/cdn/shop/files/Mosshammer_Website-1.jpg?v=1683717775&width=1920"
              alt="Customer receiving an order at a butcher shop"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div
          className={`${container} grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16`}
        >
          <div className="order-2 overflow-hidden lg:order-1">
            <img
              src="https://chickenvicken.in/cdn/shop/files/Happy_customer.png?v=1771416342"
              alt="Customer receiving a fresh food order from a shop attendant"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div className="order-1 lg:order-2">
            <p className="mb-3 flex items-center gap-2.5 font-worksans text-[11px] font-bold tracking-[0.15em] text-[#77736d]">
              <span className="h-px w-5 bg-brand" />
              WHY CHUNKNCHOP?
            </p>

            <h2 className="max-w-[560px] text-[clamp(30px,3.6vw,42px)] leading-[1.1] font-normal tracking-[-0.04em] text-[#1c1c1c]">
              Every Cut Certified. Every Order You Can Trust.
            </h2>

            <p className="mt-5 max-w-[560px] text-[13px] leading-[1.8] text-[#77736d] sm:text-sm">
              At ChunkNChop, we’re committed to changing the way Nigerians buy meat by delivering
              products that are safer, fresher, and expertly prepared. From sourcing to delivery,
              every step is designed to give you confidence in what you&apos;re bringing home.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div className="flex items-start gap-3" key={feature.title}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#fff0df] text-brand">
                    <Check size={17} strokeWidth={2.5} />
                  </span>

                  <div className="min-w-0">
                    <h3 className="m-0 text-[13px] font-bold text-[#24231f]">{feature.title}</h3>
                    <p className="mt-1 mb-0 text-[11px] leading-[1.6] text-[#88847d]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link href="/about" className={buttonClass}>
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
