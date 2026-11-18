'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

const CONTACT_EMAIL = 'hello@chunknchop.com';
const CONTACT_PHONE = '+2340000000000';
const WHATSAPP_NUMBER = '2340000000000';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const subject = encodeURIComponent(form.subject || 'Customer enquiry - ChunkNChop');

    const body = encodeURIComponent(
      `Hello ChunkNChop,\n\nName: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`,
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  const contactItems = [
    {
      symbol: '@',
      title: 'Email Us',
      value: CONTACT_EMAIL,
      description: 'Send us your questions and enquiries.',
      href: `mailto:${CONTACT_EMAIL}`,
    },
    {
      symbol: '☎',
      title: 'Call Us',
      value: CONTACT_PHONE,
      description: 'Speak with our customer support team.',
      href: `tel:${CONTACT_PHONE}`,
    },
    {
      symbol: 'W',
      title: 'WhatsApp',
      value: 'Chat with our team',
      description: 'Reach out to us through WhatsApp.',
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf9f6] text-[#201a17]">
      {}
      <section className="relative overflow-hidden bg-[#100d0b] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#a45d3d]/15 blur-[100px]" />

        <div className="relative mx-auto max-w-[1100px]">
          <span className="text-[10px] font-bold uppercase tracking-[2px] text-brand">
            Contact ChunkNChop
          </span>

          <h1 className="mt-4 max-w-[650px] text-4xl font-black leading-tight tracking-[-1.5px] sm:text-5xl">
            Let's talk about
            <span className="block text-brand">what you need.</span>
          </h1>

          <p className="mt-4 max-w-[440px] text-[12px] leading-[2] text-[#b4a69d]">
            Have a question about an order, delivery or our products? We're happy to hear from you.
          </p>
        </div>
      </section>

      {}
      <section className="px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#a87358]">
              Get in Touch
            </span>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.8px] sm:text-3xl">
              We'd love to hear from you.
            </h2>

            <p className="mt-3 max-w-[380px] text-[11px] leading-[2] text-[#766c65]">
              Whether you need help with an order, have a product enquiry or simply want to know
              more about ChunkNChop, our team is ready to assist.
            </p>

            <div className="mt-8 space-y-4">
              {contactItems.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  target={item.title === 'WhatsApp' ? '_blank' : undefined}
                  rel={item.title === 'WhatsApp' ? 'noopener noreferrer' : undefined}
                  className="group flex items-start gap-4 rounded-2xl border border-[#eae5de] bg-white p-4 transition hover:border-brand/50 hover:shadow-md hover:shadow-[#241914]/5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-[#a87358]">
                    {item.symbol}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[12px] font-bold">{item.title}</h3>

                    <p className="mt-1 break-words text-[11px] font-semibold text-[#a87358]">
                      {item.value}
                    </p>

                    <p className="mt-1 text-[10px] leading-relaxed text-[#91867d]">
                      {item.description}
                    </p>
                  </div>

                  <span className="mt-1 shrink-0 text-lg text-[#b9aaa0] transition group-hover:translate-x-1 group-hover:text-[#a87358]">
                    →
                  </span>
                </a>
              ))}
            </div>

            {/* Customer support */}
            <div className="mt-6 rounded-2xl bg-[#f0ede8] p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-[#a87358]">
                  ◷
                </span>

                <h3 className="text-[12px] font-bold">Customer Support</h3>
              </div>

              <p className="mt-2 text-[11px] leading-[1.9] text-[#766c65]">
                Contact us through email or WhatsApp for assistance with your orders and enquiries.
              </p>
            </div>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5ded6] text-[12px] font-bold text-[#8c7769] transition hover:border-brand hover:bg-brand hover:text-white"
              >
                IG
              </a>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5ded6] text-[12px] font-bold text-[#8c7769] transition hover:border-brand hover:bg-brand hover:text-white"
              >
                W
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div className="rounded-2xl border border-[#eae5de] bg-white p-5 shadow-sm shadow-[#241914]/[0.02] sm:p-8">
            <div>
              <h2 className="text-lg font-black tracking-[-0.5px]">Send us a message</h2>

              <p className="mt-2 text-[11px] leading-relaxed text-[#91867d]">
                Fill in the details below and we'll help you with your enquiry.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-2 block text-[10px] font-bold text-[#51463f]"
                >
                  Your Name
                </label>

                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Enter your full name"
                  className="h-11 w-full rounded-xl border border-[#eae5de] bg-[#faf9f6] px-4 text-[11px] outline-none transition placeholder:text-[#b1a79f] focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block text-[10px] font-bold text-[#51463f]"
                >
                  Email Address
                </label>

                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-[#eae5de] bg-[#faf9f6] px-4 text-[11px] outline-none transition placeholder:text-[#b1a79f] focus:border-[#bd8b70] focus:bg-white focus:ring-2 focus:ring-[#bd8b70]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="mb-2 block text-[10px] font-bold text-[#51463f]"
                >
                  Subject
                </label>

                <select
                  id="contact-subject"
                  required
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  className="h-11 w-full rounded-xl border border-[#eae5de] bg-[#faf9f6] px-4 text-[11px] outline-none transition focus:border-[#bd8b70] focus:bg-white"
                >
                  <option value="" disabled>
                    Select an enquiry type
                  </option>
                  <option value="Order enquiry">Order enquiry</option>
                  <option value="Delivery enquiry">Delivery enquiry</option>
                  <option value="Product enquiry">Product enquiry</option>
                  <option value="Payment issue">Payment issue</option>
                  <option value="Refund or cancellation">Refund or cancellation</option>
                  <option value="General enquiry">General enquiry</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-[10px] font-bold text-[#51463f]"
                >
                  Your Message
                </label>

                <textarea
                  id="contact-message"
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={5}
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  placeholder="Tell us how we can help..."
                  className="w-full resize-y rounded-xl border border-[#eae5de] bg-[#faf9f6] px-4 py-3 text-[11px] leading-[1.8] outline-none transition placeholder:text-[#b1a79f] focus:border-[#bd8b70] focus:bg-white focus:ring-2 focus:ring-[#bd8b70]/10"
                />

                <p className="mt-1 text-right text-[9px] text-[#a49a91]">
                  {form.message.length}/3000
                </p>
              </div>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#100d0b] text-[11px] font-bold text-white transition hover:bg-[#bd8b70]"
              >
                Send Message
                <span aria-hidden="true">→</span>
              </button>

              <p className="text-center text-[10px] leading-relaxed text-[#a49a91]">
                Your email application will open with your message prepared for sending.
              </p>
            </form>
          </div>
        </div>
      </section>

      {}
      <section className="px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-5 rounded-2xl bg-[#f0ede8] p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#bd8b70]/10 text-sm font-bold text-[#a87358]">
              ?
            </span>

            <div>
              <h3 className="text-[13px] font-bold">Looking for a quick answer?</h3>

              <p className="mt-1 text-[11px] text-[#766c65]">
                Visit our frequently asked questions page.
              </p>
            </div>
          </div>

          <Link
            href="/faqs"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#d9c9bd] px-5 py-3 text-[11px] font-bold text-[#76513e] transition hover:bg-[#bd8b70] hover:text-white"
          >
            Browse FAQs
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
