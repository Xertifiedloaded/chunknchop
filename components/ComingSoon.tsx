"use client";

import { FormEvent, useState } from "react";

const steps = [
    {
        number: "01",
        title: "PICK YOUR CUT",
        description:
            "Browse beef, goat, chicken and more. Set the weight you need.",
    },
    {
        number: "02",
        title: "WE CHOP IT",
        description:
            "Chunks, slices or mince. Tell us how you like it and we cut to order.",
    },
    {
        number: "03",
        title: "DELIVERED COLD",
        description:
            "Packed on ice and brought to your door in a delivery window you choose.",
    },
];

const meats = ["BEEF", "GOAT", "LAMB", "CHICKEN", "PORK"];

type Status = "idle" | "loading" | "joined" | "already_joined" | "error";

export default function ComingSoon() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!email.trim() || status === "loading") return;

        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setStatus("error");
                setMessage(data.message ?? "Something went wrong. Please try again.");
                return;
            }

            setStatus(data.status === "already_joined" ? "already_joined" : "joined");
            setMessage(data.message);

            if (data.status === "joined") setEmail("");
        } catch {
            setStatus("error");
            setMessage("Network error. Please check your connection and try again.");
        }
    }

    function joinWaitlist() {
        document
            .getElementById("waitlist")
            ?.scrollIntoView({ behavior: "smooth" });
    }

    return (
        <main className="min-h-screen bg-[#100d0e] text-[#f7f1e9]">
            <header className="mx-auto font-sans flex h-19.5 max-w-7xl items-center justify-between px-6 lg:px-10">
                <a
                    href="#"
                    className="font-black tracking-[-1.5px] text-[#f7f1e9] text-lg "
                >
                    CHUNK <span className="text-brand">N</span> CHOP
                </a>

                <button
                    onClick={joinWaitlist}
                    className="bg-brand px-5 py-3 text-[10px] font-black tracking-[1.5px] text-[#100d0e] transition hover:bg-brand"
                >
                    COMING SOON
                </button>
            </header>

            <section className="mx-auto grid font-worksans  max-w-7xl border-b border-white/4 px-6 pb-16 pt-10 lg:grid-cols-2 lg:px-10 lg:pb-20 lg:pt-16">
                <div className="flex flex-col  justify-center pr-0 lg:pr-16">
                    <h1 className="max-w-150 font-worksans font-black uppercase leading-[0.88] tracking-[-3px] text-[#f7f1e9] text-6xl  lg:text-[82px] xl:text-[92px]">
                        FRESH MEAT.
                        <br />
                        CHOPPED
                        <br />
                        YOUR WAY.
                    </h1>

                    <p className="mt-7 max-w-125 font-sora text-sm leading-[1.55] text-[#d2c8c0] ">
                        ChunkNChop is almost here. Choose your cut, set your weight and
                        get it delivered cold. Join the waitlist and be first in line.
                    </p>

                    <div className="mt-6 w-full max-w-xl font-sora">
                        <label
                            htmlFor="hero-email"
                            className="mb-2 block text-[10px] font-black tracking-[1.5px] text-[#f7f1e9]"
                        >
                            YOUR EMAIL
                        </label>

                        <form
                            onSubmit={handleSubmit}
                            className="flex w-full flex-col gap-2 sm:flex-row"
                        >
                            <input
                                id="hero-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={status === "loading"}
                                className="box-border h-12 min-h-12 w-full min-w-0 flex-1 appearance-none rounded-none border-0 bg-[#f4eee7] px-4 py-0 text-[12px] leading-none text-[#171213] outline-none placeholder:text-[#8d8580] disabled:opacity-60 sm:h-12 sm:min-h-12"
                            />

                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="box-border  h-12 min-h-12 w-full shrink-0 rounded-sm bg-brand px-7 py-0 text-[10px] font-black leading-none tracking-wide text-white transition hover:bg-[#ff674f] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:min-h-12 sm:w-auto"
                            >
                                {status === "loading" ? "JOINING..." : "NOTIFY ME"}
                            </button>
                        </form>

                        {(status === "joined" || status === "already_joined") && (
                            <p
                                role="status"
                                className="mt-3 text-[11px] font-bold text-brand"
                            >
                                {message}
                            </p>
                        )}

                        {status === "error" && (
                            <p
                                role="alert"
                                className="mt-3 text-[11px] font-bold text-red-400"
                            >
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-12 flex min-h-95 items-center justify-center bg-[#241b19] lg:mt-0 lg:min-h-125">
                    <div className="relative h-full min-h-95 w-full overflow-hidden lg:min-h-125">
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-80"
                            style={{
                                backgroundImage:
                                    "url(https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=1400&q=90)",
                            }}
                        />

                        <div className="absolute inset-0 bg-[#211715]/45" />
                    </div>
                </div>
            </section>

            <section className="overflow-hidden bg-ink">
                <div className="marquee-track flex w-max">
                    {[...meats, ...meats].map((meat, index) => (
                        <div
                            key={`${meat}-${index}`}
                            className="flex h-14.5 w-35 shrink-0 items-center justify-center border-b border-[#100d0e]/10 font-black tracking-[-.5px] text-[#100d0e] text-[13px] sm:h-[70px] sm:w-[220px] sm:text-[16px]"
                        >
                            {meat}
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
                <div className="max-w-212.5 font-heading">
                    <span className="inline-block bg-brand px-4 py-2 text-[9px] font-black tracking-[1.5px] text-[#100d0e]">
                        WHAT&apos;S COMING
                    </span>

                    <h2 className="mt-5 max-w-175 font-black uppercase leading-[1.2] tracking-[-2px] text-4xl sm:text-[64px] lg:text-[70px]">
                        ORDER MEAT THE
                        <br />
                        EASY WAY
                    </h2>
                </div>

                <div className="mt-12 grid gap-4 md:grid-cols-3">
                    {steps.map((step) => (
                        <article
                            key={step.number}
                            className="min-h-56.25 border border-white/[0.07] bg-[#1b1514] p-7"
                        >
                            <div className="font-black leading-none text-brand text-[46px]">
                                {step.number}
                            </div>

                            <h3 className="mt-3 font-black tracking-[-.5px] text-[20px]">
                                {step.title}
                            </h3>

                            <p className="mt-4 max-w-70 text-[13px] leading-[1.55] text-[#c3b8b0]">
                                {step.description}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            <section
                id="waitlist"
                className="border-y font-heading border-white/4 bg-[#211817] px-6 py-20 text-center lg:py-24"
            >
                <div className="mx-auto max-w-212.5">
                    <h2 className="font-black uppercase leading-[0.9] tracking-[-2px] text-[46px] sm:text-[62px] lg:text-[70px]">
                        DON&apos;T MISS THE OPENING
                    </h2>

                    <p className="mx-auto font-sans mt-5 max-w-140 text-[13px] leading-[1.6] text-[#c9beb7] sm:text-[14px]">
                        Waitlist members hear first about launch day and opening offers.
                    </p>

                    <button
                        onClick={() => {
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            });

                            setTimeout(() => {
                                document.getElementById("hero-email")?.focus();
                            }, 500);
                        }}
                        className="mt-7 font-sans bg-brand px-7 py-4 text-[10px] font-black tracking-wide text-[#100d0e] transition hover:bg-[#ff674f]"
                    >
                        JOIN THE WAITLIST
                    </button>
                </div>
            </section>

            <footer className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-9 sm:flex-row sm:items-center sm:justify-between lg:px-10">
                <p className="text-[10px] text-[#817873]">
                    © ChunkNChop. All rights reserved.
                </p>
            </footer>
        </main>
    );
}