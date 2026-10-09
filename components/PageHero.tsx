import Breadcrumbs from "./Breadcrumbs";

type HeroProps = {
  title: string;
  description: string;
  image: string;
  eyebrow?: string;
  cta?: {
    label: string;
    href: string;
  };
  crumbs?: Crumb[];
};

export function PageHero({ title, description, image, eyebrow, cta, crumbs }: HeroProps) {
  return (
    <section className="relative isolate flex min-h-[55svh] w-full items-end overflow-hidden bg-[#241b19] font-worksans sm:min-h-[60svh]">
      <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />

      <div className="absolute inset-0 -z-10 bg-[#211715]/55" />

      <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#100d0e] via-[#100d0e]/35 to-transparent" />

      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-8 sm:py-20 lg:px-10">
        <Breadcrumbs crumbs={crumbs} className="mb-8" />

        <div className="max-w-3xl">
          {eyebrow && <p className="mb-3 text-xs font-black tracking-[0.2em] text-[#d8cec7] uppercase">{eyebrow}</p>}

          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.9] font-black tracking-[-1px] text-[#f7f1e9] uppercase">{title}</h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-[#e4dbd3] sm:text-base">{description}</p>

          {cta && (
            <Link href={cta.href} className="mt-7 inline-flex bg-brand px-6 py-3.5 text-sm font-black tracking-wide text-white transition hover:bg-[#a91f1b]">
              {cta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
