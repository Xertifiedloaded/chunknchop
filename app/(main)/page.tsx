"use client";

import { useState } from "react";

const categories = [
  {
    title: "BEEF",
    description: "Steaks, roasts, mince, ribs.",
    image:
      "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "GOAT & LAMB",
    description: "Bone-in chops, leg, stew pieces.",
    image:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "CHICKEN",
    description: "Whole, breasts, thighs, wings.",
    image:
      "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "PORK & SPECIALTY",
    description: "Ribs, belly, sausages, offal.",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
  },
];

const products = [
  {
    category: "BEEF",
    name: "RIBEYE STEAK",
    description: "Well-marbled, cut 2–3 cm thick.",
    price: "₦12,000/kg",
    image:
      "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=85",
  },
  {
    category: "GOAT",
    name: "GOAT STEW PIECES",
    description: "Bone-in, chopped to stew size.",
    price: "₦9,500/kg",
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85",
  },
  {
    category: "CHICKEN",
    name: "CHICKEN THIGHS",
    description: "Skin-on or skinless, trimmed.",
    price: "₦4,500/kg",
    image:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=900&q=85",
  },
  {
    category: "BEEF",
    name: "LEAN BEEF MINCE",
    description: "Ground fresh, never pre-packed.",
    price: "₦7,000/kg",
    image:
      "https://images.unsplash.com/photo-1588347818036-558601350947?auto=format&fit=crop&w=900&q=85",
  },
];

const faqs = [
  {
    question: "HOW DO I CHOOSE MY CUT AND WEIGHT?",
    answer:
      "Choose a product, select the quantity you need and add it to your cart. Weight options are shown on each product.",
  },
  {
    question: "HOW IS THE MEAT KEPT FRESH IN TRANSIT?",
    answer:
      "Orders are chilled immediately after cutting, sealed securely and transported in temperature-controlled packaging.",
  },
  {
    question: "WHAT ARE YOUR DELIVERY AREAS AND TIMES?",
    answer:
      "Delivery slots are shown at checkout based on your address and current availability.",
  },
  {
    question: "CAN I CHANGE OR CANCEL AN ORDER?",
    answer:
      "Contact us as soon as possible. Orders already being prepared may not be changeable.",
  },
  {
    question: "WHAT IF I'M NOT HAPPY WITH MY ORDER?",
    answer:
      "Contact support with your order number and we will review the issue and arrange the appropriate resolution.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [email, setEmail] = useState("");

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });

    setMobileMenu(false);
  };

  return (
    <main className="min-h-screen bg-[#17110f] text-[#f8f3eb]">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0e0a09]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-5 lg:px-8">
          <button
            onClick={() => scrollTo("top")}
            className="font-black tracking-[-1px]"
          >
            CHUNKN<span className="text-[#b9aaa0]">CHOP</span>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => scrollTo("shop")}
              className="text-[8px] font-bold tracking-[1px] text-[#c9beb7] transition hover:text-white"
            >
              SHOP
            </button>
            <button
              onClick={() => scrollTo("meatbox")}
              className="text-[8px] font-bold tracking-[1px] text-[#c9beb7] transition hover:text-white"
            >
              MEATBOX
            </button>
            <button
              onClick={() => scrollTo("how")}
              className="text-[8px] font-bold tracking-[1px] text-[#c9beb7] transition hover:text-white"
            >
              HOW IT WORKS
            </button>
            <button
              onClick={() => scrollTo("faq")}
              className="text-[8px] font-bold tracking-[1px] text-[#c9beb7] transition hover:text-white"
            >
              FAQ
            </button>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => scrollTo("shop")}
              className="h-8 border border-white/60 px-4 text-[8px] font-black tracking-wide transition hover:bg-white hover:text-black"
            >
              LOG IN
            </button>

            <button
              onClick={() => scrollTo("shop")}
              className="h-8 bg-[#c9251f] px-4 text-[8px] font-black tracking-wide transition hover:bg-[#aa1f1b]"
            >
              CART (0)
            </button>
          </div>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="text-xl md:hidden"
          >
            {mobileMenu ? "×" : "☰"}
          </button>
        </div>

        {mobileMenu && (
          <div className="border-t border-white/5 bg-[#0e0a09] px-5 py-5 md:hidden">
            <div className="flex flex-col gap-5">
              <button
                onClick={() => scrollTo("shop")}
                className="text-left text-[10px] font-bold tracking-widest"
              >
                SHOP
              </button>
              <button
                onClick={() => scrollTo("meatbox")}
                className="text-left text-[10px] font-bold tracking-widest"
              >
                MEATBOX
              </button>
              <button
                onClick={() => scrollTo("how")}
                className="text-left text-[10px] font-bold tracking-widest"
              >
                HOW IT WORKS
              </button>
              <button
                onClick={() => scrollTo("faq")}
                className="text-left text-[10px] font-bold tracking-widest"
              >
                FAQ
              </button>
            </div>
          </div>
        )}
      </header>

      <section
        id="top"
        className="mx-auto grid max-w-[1180px] gap-10 px-6 py-14 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-12 lg:py-20"
      >
        <div>
          <span className="mb-4 block text-[8px] font-black tracking-[2px] text-[#c8463e]">
            POULTRY
          </span>

          <h1 className="font-[Impact,Arial_Narrow,sans-serif] text-[48px] font-black uppercase leading-[0.88] tracking-tight sm:text-[60px] lg:text-[76px]">
            FRESH CHICKEN,
            <br />
            NEVER PRE-
            <br />
            PACKED.
          </h1>

          <p className="mt-5 max-w-md text-[10px] leading-relaxed text-[#b6a99d]">
            Whole birds, thighs, breasts and wings, skin-on or skinless.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => scrollTo("shop")}
              className="bg-[#c9251f] px-5 py-3 text-[8px] font-black tracking-wide transition hover:bg-[#a91f1b]"
            >
              SHOP CHICKEN
            </button>

            <button
              onClick={() => scrollTo("meatbox")}
              className="border border-white/70 px-5 py-3 text-[8px] font-black tracking-wide transition hover:bg-white hover:text-black"
            >
              SEE MEATBOXES
            </button>
          </div>

          <div className="mt-7 flex gap-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <span
                key={item}
                className={`h-1.5 w-1.5 rounded-full ${
                  item === 1 ? "bg-white" : "bg-[#655951]"
                }`}
              />
            ))}
          </div>
        </div>

        <div
          className="relative min-h-[310px] bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=1400&q=90)",
          }}
        >
          <div className="absolute inset-0 bg-black/20" />

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="relative text-[8px] font-bold tracking-[1px] text-white">
              FRESH CHICKEN • CUT TO ORDER
            </span>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 bg-[#c9251f] px-5 py-5">
        {[
          "HYGIENICALLY PROCESSED",
          "PACKED & SEALED ON ICE",
          "CUT EXACTLY HOW YOU LIKE",
          "FRESHNESS GUARANTEE",
        ].map((item) => (
          <span
            key={item}
            className="font-[Impact,Arial_Narrow,sans-serif] text-[8px] tracking-wide"
          >
            {item}
          </span>
        ))}
      </section>

      <section id="shop" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-[1084px]">
          <span className="mb-3 block text-[8px] font-black tracking-[2px] text-[#c8463e]">
            SHOP BY MEAT
          </span>

          <h2 className="font-[Impact,Arial_Narrow,sans-serif] text-[38px] uppercase leading-none sm:text-[48px]">
            WHAT ARE YOU COOKING?
          </h2>

          <p className="mt-2 max-w-xl text-[10px] leading-relaxed text-[#b6a99d]">
            From everyday staples to weekend showstoppers, every category is
            trimmed on request.
          </p>

          <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <button
                key={category.title}
                className="overflow-hidden border border-white/5 bg-[#2b1e19] text-left transition hover:-translate-y-1"
              >
                <div
                  className="relative h-44 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${category.image})`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/25" />
                </div>

                <div className="p-4">
                  <h3 className="font-[Impact,Arial_Narrow,sans-serif] text-[17px]">
                    {category.title}
                  </h3>

                  <p className="mt-1 text-[9px] leading-relaxed text-[#b7a89c]">
                    {category.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f1e9dc] px-6 py-20 text-[#201614] lg:px-12">
        <div className="mx-auto max-w-[1084px]">
          <span className="mb-3 block text-[8px] font-black tracking-[2px] text-[#c9251f]">
            BEST SELLERS
          </span>

          <h2 className="font-[Impact,Arial_Narrow,sans-serif] text-[38px] uppercase leading-none sm:text-[48px]">
            BUTCHER&apos;S FAVOURITES
          </h2>

          <p className="mt-2 max-w-xl text-[10px] leading-relaxed text-[#665950]">
            Price per kilo. Add to cart and set your cut size at checkout.
          </p>

          <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <article key={product.name} className="bg-white">
                <div
                  className="h-48 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${product.image})`,
                  }}
                />

                <div className="p-3">
                  <span className="text-[7px] font-black tracking-[1px] text-[#c9251f]">
                    {product.category}
                  </span>

                  <h3 className="mt-1 font-[Impact,Arial_Narrow,sans-serif] text-[15px]">
                    {product.name}
                  </h3>

                  <p className="mt-1 min-h-[30px] text-[8px] leading-relaxed text-[#75675e]">
                    {product.description}
                  </p>

                  <strong className="mt-2 block font-[Impact,Arial_Narrow,sans-serif] text-[16px]">
                    {product.price}
                  </strong>

                  <button className="mt-3 w-full bg-[#c9251f] py-3 text-[8px] font-black text-white transition hover:bg-[#a91f1b]">
                    ADD TO CART
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-[1084px]">
          <span className="mb-3 block text-[8px] font-black tracking-[2px] text-[#c8463e]">
            HOW IT WORKS
          </span>

          <h2 className="font-[Impact,Arial_Narrow,sans-serif] text-[38px] uppercase leading-none sm:text-[48px]">
            FROM OUR BLOCK TO YOUR KITCHEN
          </h2>

          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "01",
                "CHOOSE",
                "Browse cuts and tell us your weight, cut and packaging preference.",
              ],
              [
                "02",
                "WE CUT",
                "Your order is cut fresh to the exact size you choose.",
              ],
              [
                "03",
                "WE PACK",
                "Vacuum-sealed or tray-packed, then boxed with ice to hold the cold chain.",
              ],
              [
                "04",
                "YOU COOK",
                "Delivered to your kitchen window. Straight to the freezer, fridge, or fire up the grill.",
              ],
            ].map(([number, title, description]) => (
              <div key={number}>
                <strong className="font-[Impact,Arial_Narrow,sans-serif] text-[42px] leading-none text-[#c9251f]">
                  {number}
                </strong>

                <h3 className="mt-2 font-[Impact,Arial_Narrow,sans-serif] text-[15px]">
                  {title}
                </h3>

                <p className="mt-2 max-w-[190px] text-[9px] leading-relaxed text-[#b6a99d]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="meatbox" className="bg-[#241814] px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-[1084px]">
          <span className="mb-3 block text-[8px] font-black tracking-[2px] text-[#c8463e]">
            MEATBOX
          </span>

          <h2 className="font-[Impact,Arial_Narrow,sans-serif] text-[38px] uppercase leading-none sm:text-[48px]">
            PICK A MEATBOX, SKIP THE DECISIONS
          </h2>

          <p className="mt-2 text-[10px] text-[#b6a99d]">
            Ready-made boxes for families, grill days and parties.
          </p>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            {[
              {
                label: "WEEKLY",
                title: "FAMILY MEATBOX",
                content: "Beef, chicken and mince quantities",
                price: "₦35,000",
                featured: false,
              },
              {
                label: "MOST POPULAR",
                title: "GRILL MASTER MEATBOX",
                content: "Steaks, ribs, sausages and marinades",
                price: "₦48,000",
                featured: true,
              },
              {
                label: "FOR EVENTS",
                title: "PARTY MEATBOX",
                content: "Goat, chicken and beef for 15+ guests",
                price: "₦120,000",
                featured: false,
              },
            ].map((box) => (
              <div
                key={box.title}
                className={`p-6 ${
                  box.featured ? "bg-[#c9251f]" : "bg-[#1c1310]"
                }`}
              >
                <span className="text-[7px] font-bold tracking-[1px] text-[#c8bbb0]">
                  {box.label}
                </span>

                <h3 className="mt-3 font-[Impact,Arial_Narrow,sans-serif] text-[21px] uppercase leading-none">
                  {box.title}
                </h3>

                <p className="mt-3 min-h-[35px] text-[9px] leading-relaxed text-[#c7b9ae]">
                  [CONTENTS: {box.content}]
                </p>

                <strong className="mt-4 block font-[Impact,Arial_Narrow,sans-serif] text-[18px]">
                  {box.price}
                </strong>

                <button
                  className={`mt-4 w-full border py-3 text-[8px] font-black ${
                    box.featured
                      ? "border-white text-white hover:bg-white hover:text-[#c9251f]"
                      : "border-white/60 hover:bg-white hover:text-black"
                  }`}
                >
                  ADD MEATBOX TO CART
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto grid max-w-[1084px] gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div
            className="h-[330px] bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=90)",
            }}
          />

          <div>
            <span className="mb-3 block text-[8px] font-black tracking-[2px] text-[#c8463e]">
              OUR STANDARD
            </span>

            <h2 className="font-[Impact,Arial_Narrow,sans-serif] text-[38px] uppercase leading-[0.92] sm:text-[52px]">
              FRESHNESS ISN&apos;T A PROMISE. IT&apos;S A PROCESS.
            </h2>

            <p className="mt-4 text-[10px] leading-relaxed text-[#b6a99d]">
              Every cut is traceable, inspected and temperature-controlled
              from the first knife stroke to your doorstep.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <b className="block text-[8px]">SOURCED WITH CARE</b>
                <span className="text-[8px] text-[#aa9c91]">
                  Supplier / farm details
                </span>
              </div>

              <div>
                <b className="block text-[8px]">CUT TO YOUR SPEC</b>
                <span className="text-[8px] text-[#aa9c91]">
                  Thickness, trim, bone-in or boneless. You decide.
                </span>
              </div>

              <div>
                <b className="block text-[8px]">COLD CHAIN, ALWAYS</b>
                <span className="text-[8px] text-[#aa9c91]">
                  Chilled storage, insulated packing and ice for the journey.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="bg-[#f1e9dc] px-6 py-20 text-[#201614] lg:px-12"
      >
        <div className="mx-auto max-w-[1084px]">
          <span className="mb-3 block text-[8px] font-black tracking-[2px] text-[#c9251f]">
            QUESTIONS
          </span>

          <h2 className="font-[Impact,Arial_Narrow,sans-serif] text-[38px] uppercase leading-none sm:text-[48px]">
            BEFORE YOU ORDER
          </h2>

          <div className="mt-8 max-w-3xl">
            {faqs.map((faq, index) => (
              <button
                key={faq.question}
                onClick={() =>
                  setOpenFaq(openFaq === index ? null : index)
                }
                className="relative block w-full border-t border-[#c8bcae] py-5 pr-10 text-left last:border-b"
              >
                <span className="font-[Impact,Arial_Narrow,sans-serif] text-[10px]">
                  {faq.question}
                </span>

                <span className="absolute right-2 top-4 text-sm">
                  {openFaq === index ? "−" : "+"}
                </span>

                {openFaq === index && (
                  <p className="mt-3 max-w-2xl text-[9px] leading-relaxed text-[#665950]">
                    {faq.answer}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#c9251f] px-6 py-16 text-center">
        <h2 className="font-[Impact,Arial_Narrow,sans-serif] text-[38px] uppercase leading-none sm:text-[52px]">
          FRESH MEAT. ORDERED IN MINUTES.
        </h2>

        <p className="mt-3 text-[9px]">
          Get offers, new cuts and seasonal bundles sent straight to your
          inbox.
        </p>

        <div className="mx-auto mt-5 flex max-w-md flex-col sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your email address"
            className="h-10 flex-1 border-0 px-4 text-[9px] text-black outline-none"
          />

          <button className="h-10 bg-[#160f0d] px-6 text-[8px] font-black">
            JOIN THE LIST
          </button>
        </div>

        <button
          onClick={() => scrollTo("shop")}
          className="mt-4 border border-white px-7 py-3 text-[8px] font-black transition hover:bg-white hover:text-[#c9251f]"
        >
          START YOUR ORDER
        </button>
      </section>

      <footer className="bg-[#0f0b0a] px-6 py-12 lg:px-12">
        <div className="mx-auto grid max-w-[1084px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-black tracking-[-1px]">
              PRIME <span className="text-[#b9aaa0]">CUTS</span>
            </div>

            <p className="mt-3 max-w-[220px] text-[8px] leading-relaxed text-[#9b8e83]">
              Fresh meat, cut to order and delivered cold.
            </p>
          </div>

          <div>
            <b className="block text-[7px] tracking-[1px] text-[#a99b90]">
              SHOP
            </b>

            <div className="mt-3 space-y-2 text-[8px] text-[#9b8e83]">
              <div>BEEF</div>
              <div>GOAT & LAMB</div>
              <div>CHICKEN</div>
              <div>MEATBOX</div>
            </div>
          </div>

          <div>
            <b className="block text-[7px] tracking-[1px] text-[#a99b90]">
              HELP
            </b>

            <div className="mt-3 space-y-2 text-[8px] text-[#9b8e83]">
              <div>DELIVERY INFO</div>
              <div>FAQS</div>
              <div>CONTACT</div>
            </div>
          </div>

          <div>
            <b className="block text-[7px] tracking-[1px] text-[#a99b90]">
              CONTACT
            </b>

            <div className="mt-3 space-y-2 text-[8px] text-[#9b8e83]">
              <div>[PHONE]</div>
              <div>[EMAIL]</div>
              <div>[HOURS]</div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-[1084px] border-t border-white/5 pt-5 text-center text-[7px] text-[#6c615a]">
          © Prime Cuts. All rights reserved.
        </div>
      </footer>
    </main>
  );
}