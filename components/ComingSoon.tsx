"use client";

import { highlights } from "@/lib";
import Image from "next/image";
import { FormEvent, useState } from "react";

type Status =
  | "idle"
  | "loading"
  | "joined"
  | "already_joined"
  | "error";

const problems = [
  {
    icon: "✧",
    title: "Passing through\nsafety war",
    description:
      "Open-air stalls, hot sun, no idea how long it has been sitting on the table. Do you still catch slimy parts, even inside packaged and branded meats?",
  },
  {
    icon: "⚖",
    title: "Vendors you can't\ntrust",
    description:
      "You paid for a kilo. Did you really get one? Ever caught them using paracetamol as a meat tenderizer, or burning old car tyres to singe cowskin?",
  },
  {
    icon: "⌁",
    title: "A mixture of chaos",
    description:
      "Half of what goes into the pot isn't what you asked for: fat, bones and antibiotic residues. Ever bought horse meat or bushmeat as beef?",
  },
  {
    icon: "◷",
    title: "Dealing with hours\nlost",
    description:
      "The trip, the haggling, the queue, then the trip back. Has the delivery guy used traffic as an excuse or tampered with your delivery before?",
  },
];

const steps = [
  {
    number: "01",
    title: "Pick your cut",
    description:
      "Beef, chicken, pork, and more. You pay for exactly what you choose.",
  },
  {
    number: "02",
    title: "We chop it your way",
    description:
      "Pepper-soup chunks, stew cuts, slices or mince, cut fresh to order.",
  },
  {
    number: "03",
    title: "It arrives chilled",
    description:
      "Packed on ice and delivered in any delivery window you choose.",
  },
];

export default function ComingSoon() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || status === "loading") {
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(
          data.message ??
          "Something went wrong. Please try again.",
        );
        return;
      }

      if (data.status === "already_joined") {
        setStatus("already_joined");
      } else {
        setStatus("joined");
      }

      setMessage(
        data.message ?? "You're on the waitlist!",
      );

      if (data.status === "joined") {
        setName("");
        setEmail("");
      }
    } catch {
      setStatus("error");
      setMessage(
        "Network error. Please check your connection and try again.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f4efeb] text-[#201d1c]">
      <section className="bg-[#1d1b1a] text-[#f6f1ed]">
        <div className="mx-auto max-w-345 px-6 sm:px-10 lg:px-16">
          <header className="flex h-19 items-center justify-between">
            <a
              href="#"
              className="flex items-center"
            >
      Chunk<span className="text-brand text-lg">N</span>chop 
            </a>

            <span className="rounded-full animate-pulse border border-[#575250] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[#bcb5b1]">
              Coming soon
            </span>
          </header>
          <div
            id="waitlist"
            className="grid min-h-112.5 items-center gap-12 py-16 lg:grid-cols-[1fr_420px] lg:py-20"
          >

            <div className="max-w-170 ">
              <h1 className="text-[48px] font-impact  font-black leading-[1.2] tracking-[-2.8px] sm:text-[62px] lg:text-[72px]">
                <span className="text-brand">
                  Fresh meat.
                </span>

                <br />

                Chopped the way

                <br />

                you cook.
              </h1>

              <p className="mt-7 font-sora max-w-137.5 text-[14px] leading-6 text-[#c8c1bd]">
                Fair market prices without the market wahala.
                No guessing on the scale. Choose cuts and we
                deliver them chilled to your location.
              </p>
            </div>


            <div className="rounded-xl font-worksans bg-[#f5f0ec] p-6 text-[#211e1d] shadow-2xl">
              <h2 className="text-[18px] font-extrabold">
                Save your spot on the list
              </h2>

              <p className="mt-2 text-[11px] leading-5 text-[#6e6662]">
                Founding members get{" "}
                <span className="font-bold text-[#8b2528]">
                  massive discounts and souvenirs
                </span>{" "}
                on their first order.
              </p>


              <form
                onSubmit={handleSubmit}
                className="mt-5 space-y-3"
              >

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">
                    Name
                  </span>

                  <input
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Makinde Olaitan"
                    autoComplete="name"
                    required
                    disabled={status === "loading"}
                    className="h-11 w-full rounded-md border border-[#c9c0ba] bg-white px-3 text-[11px] outline-none transition placeholder:text-[#aaa19c] focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>


                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">
                    Email
                  </span>

                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={status === "loading"}
                    className="h-11 w-full rounded-md border border-[#c9c0ba] bg-white px-3 text-[11px] outline-none transition placeholder:text-[#aaa19c] focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                {message && (
                  <div
                    className={`rounded-md px-3 py-2 text-sm leading-4 ${status === "error"
                        ? "bg-red-50 text-red-700"
                        : status === "already_joined"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-green-50 text-green-700"
                      }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    status === "loading" ||
                    !name.trim() ||
                    !email.trim()
                  }
                  className="h-11 w-full rounded-md bg-brand text-[11px] font-bold text-[#211e1d] transition hover:bg-[#f2704e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading"
                    ? "Saving your spot..."
                    : "Save my spot"}
                </button>

                <p className="text-[8px] text-[#8d8580]">
                  We’ll only message you about launch. No spam.
                </p>
              </form>
            </div>
          </div>
        </div>


        <section className="overflow-hidden bg-ink">
          <div className="marquee-track flex w-max">
            {[...highlights, ...highlights].map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex h-14.5 shrink-0 items-center justify-center whitespace-nowrap border-b border-[#100d0e]/10 px-8 text-center text-[13px] font-black tracking-[-.5px] text-[#100d0e] sm:h-[70px] sm:px-12 sm:text-[16px]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="bg-[#f4efeb]">
        <div className="mx-auto max-w-345 px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
          <div className="mb-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#84252a]">
              E don happen to you?
            </p>

            <h2 className="mt-3 max-w-162.5 font-impact text-[32px] font-black leading-[1.02]  sm:text-[42px]">
              Buying meat shouldn’t cost you
              <br className="hidden sm:block" />
              a whole Saturday.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((problem) => (
              <article
                key={problem.title}
                className="min-h-61.25 rounded-xl bg-white p-5"
              >
                <div className="mb-4 text-xl text-[#8c252b]">
                  {problem.icon}
                </div>

                <h3 className="whitespace-pre-line text-xl font-extrabold leading-6">
                  {problem.title}
                </h3>

                <p className="mt-4 text-xs leading-[1.65] text-[#6f6965]">
                  {problem.description}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-7 text-[14px] font-bold text-[#7d2025]">
            We built ChunkNChop to fix these issues and other
            wahala you face.
          </p>
        </div>
      </section>


      <section className="bg-[#1d1b1a] text-[#f6f1ed]">
        <div className="mx-auto max-w-345 px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
            What&apos;s coming
          </p>

          <h2 className="mt-3 text-[31px] font-impact font-black leading-tight  sm:text-[40px]">
            Order fresh meat with pure vibes and steeze.
          </h2>

          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="border-t border-brand pt-5"
              >
                <div className="text-4xl font-black text-brand">
                  {step.number}
                </div>

                <h3 className="mt-2 text-md font-extrabold">
                  {step.title}
                </h3>

                <p className="mt-3 max-w-70 text-sm leading-5 text-[#aaa29e]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4efeb]">
        <div className="mx-auto grid max-w-345 gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[1fr_370px] lg:px-16 lg:py-20">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#84252a]">
              Who&apos;s behind it
            </p>

            <h2 className="mt-3 max-w-162.5 text-[32px] font-impact font-black leading-[1.4]  sm:text-[41px]">
              Built by people who study livestock science, not
              just the retail.
            </h2>

            <p className="mt-5 max-w-160 text-sm leading-6 text-[#6f6965]">
              Our founders come from animal husbandry and genetics
              backgrounds. We’ve lived through your pains and
              fears, so we handle every cut like it’s going to our
              own family’s table.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Hygienic processing",
                "Uncompromised freshness",
                "Meat intelligence",
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 self-center">
            <Founder
              image="/Ismaila_Emmanuel.jpg"
              name="Ismaila Emmanuel"
              role="Co-founder · Animal Genetics & Financial Engineering"
            />

            <Founder
              image="/Makinde_Olaitan.PNG"
              name="Makinde Olaitan"
              role="Co-founder · Animal Biotechnology & Software Engineering"
            />
          </div>
        </div>
      </section>


      <section className="bg-[#1d1b1a] text-[#f6f1ed]">
        <div className="mx-auto max-w-345 px-6 py-20 text-center sm:px-10 lg:px-16 lg:py-24">
          <h2 className="mx-auto max-w-150 text-[34px] font-black leading-[1] tracking-[-1.5px] sm:text-[45px]">
            Don&apos;t miss our first{" "}
            <span className="text-brand">500</span>
            <br />
            customers opportunity.
          </h2>

          <p className="mx-auto mt-5 max-w-135 text-[11px] leading-5 text-[#aaa29e]">
            Founding members don’t only hear launch news first.
            You also get opening discounts and first pick of
            delivery slots on launch week.
          </p>

          <a
            href="#waitlist"
            className="mt-6 inline-flex h-11 items-center rounded-md bg-brand px-7 text-[10px] font-bold text-[#211e1d] transition hover:bg-[#f2704e]"
          >
            Join the waitlist
          </a>
        </div>

        {/* FOOTER */}
        <footer className="border-t border-white/5">
          <div className="mx-auto flex max-w-345 flex-col gap-3 px-6 py-5 text-xs text-[#827b77] sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
            <span>
              © {new Date().getFullYear()} ChunkNChop Foods (Nigeria) Ltd
            </span>

          </div>
        </footer>
      </section>
    </main>
  );
}



function Founder({
  image,
  name,
  role,
}: {
  image: string;
  name: string;
  role: string;
}) {
  return (
    <div>
      <div className="aspect-[0.82] overflow-hidden rounded-lg bg-[#ddd6d1]">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      <h3 className="mt-2 text-sm font-bold">
        {name}
      </h3>

      <p className="mt-1 text-[10px] leading-3 text-[#716a66]">
        {role}
      </p>
    </div>
  );
}