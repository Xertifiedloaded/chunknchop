
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Search,
  ShoppingBag,
  CreditCard,
  Truck,
  PackageCheck,
  RotateCcw,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';

const faqGroups = [
  {
    title: 'Orders & Shopping',
    icon: ShoppingBag,
    questions: [
      {
        question: 'How do I place an order?',
        answer:
          'Browse our shop, select the meat products you want, choose your preferred quantities and add them to your cart. Proceed to checkout, provide your delivery details and complete your order.',
      },
      {
        question: 'Can I order different types of meat together?',
        answer:
          'Yes. You can add different products to your cart and check out with them together, subject to product availability.',
      },
      {
        question: 'Can I change my order after placing it?',
        answer:
          'Please contact our support team as soon as possible. Changes may not be possible once your order has entered preparation or dispatch.',
      },
      {
        question: 'How do I know if my order was successful?',
        answer:
          'After completing checkout, check your order confirmation and your account order history for the latest order details and status.',
      },
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
    questions: [
      {
        question: 'What payment methods are accepted?',
        answer:
          'Available payment methods are displayed during checkout. Select one of the payment options shown to complete your order.',
      },
      {
        question: 'Is online payment secure?',
        answer:
          'Payments are processed through the payment provider integrated into our checkout. Always complete payment through the official checkout page.',
      },
      {
        question: 'What happens if my payment is successful but my order is not confirmed?',
        answer:
          'Please contact support with your order number and payment reference so we can investigate and verify the transaction.',
      },
    ],
  },
  {
    title: 'Delivery',
    icon: Truck,
    questions: [
      {
        question: 'Do you offer home delivery?',
        answer:
          'Yes. Delivery options and applicable fees are shown during checkout based on the delivery information you provide.',
      },
      {
        question: 'How long does delivery take?',
        answer:
          'Delivery times depend on your location, order preparation and delivery availability. Any available estimate will be communicated during the ordering process.',
      },
      {
        question: 'Can I track my order?',
        answer:
          'You can check your order status through your account, where available. You can also contact our support team for assistance.',
      },
      {
        question: 'What if I am unavailable when my order arrives?',
        answer:
          'Please ensure someone is available at the delivery address to receive your order. Contact support if you need help arranging delivery.',
      },
    ],
  },
  {
    title: 'Products & Freshness',
    icon: PackageCheck,
    questions: [
      {
        question: 'Is the meat freshly prepared?',
        answer:
          'We aim to prepare and package orders with care so customers receive products in good condition.',
      },
      {
        question: 'Can I request a particular cut or portion?',
        answer:
          'Where product options allow it, you can select your preferred cut or portion when ordering. Contact us for requests that are not listed.',
      },
      {
        question: 'How should I store my meat after delivery?',
        answer:
          'Refrigerate meat promptly if you intend to use it soon, or freeze it for longer storage. Follow appropriate food-safety guidance and any product-specific instructions.',
      },
    ],
  },
  {
    title: 'Cancellations & Refunds',
    icon: RotateCcw,
    questions: [
      {
        question: 'Can I cancel my order?',
        answer:
          'Contact support as soon as possible. Cancellation depends on the current preparation and delivery status of your order.',
      },
      {
        question: 'What if I receive the wrong or damaged item?',
        answer:
          'Contact us promptly with your order number and a description of the issue. Photos can help us investigate and resolve the matter.',
      },
      {
        question: 'How do refunds work?',
        answer:
          'Refund requests are reviewed by our support team. Approved refunds are processed through the applicable payment method and provider timelines.',
      },
    ],
  },
];

export default function FAQsPage() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredGroups = faqGroups
    .map((group) => ({
      ...group,
      questions: group.questions.filter(
        (item) =>
          item.question.toLowerCase().includes(search.toLowerCase()) ||
          item.answer.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((group) => group.questions.length > 0);

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#201a17]">
      {}
      <section className="relative overflow-hidden bg-[#100d0b] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#a45d3d]/15 blur-[100px]" />

        <div className="relative mx-auto max-w-[900px] text-center">
          <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#d6aa91]">
            Help Centre
          </span>

          <h1 className="mt-4 text-4xl font-black tracking-[-1.5px] sm:text-5xl">
            Frequently Asked
            <span className="block text-[#bd8b70]">Questions</span>
          </h1>

          <p className="mx-auto mt-4 max-w-[480px] text-[12px] leading-[2] text-[#b4a69d]">
            Find answers to common questions about shopping, payments,
            delivery and your ChunkNChop orders.
          </p>

          <div className="mx-auto mt-8 flex max-w-[460px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <Search size={16} className="shrink-0 text-[#bd8b70]" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setOpenQuestion(null);
              }}
              placeholder="Search for an answer..."
              className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-[#8d8178]"
            />
          </div>
        </div>
      </section>

      {}
      <section className="px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-[850px]">
          {filteredGroups.length > 0 ? (
            <div className="space-y-10">
              {filteredGroups.map((group) => {
                const Icon = group.icon;

                return (
                  <div key={group.title}>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#bd8b70]/10 text-[#a87358]">
                        <Icon size={17} />
                      </div>

                      <h2 className="text-[14px] font-bold">
                        {group.title}
                      </h2>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#eae5de] bg-white">
                      {group.questions.map((item, index) => {
                        const questionId = `${group.title}-${index}`;
                        const isOpen = openQuestion === questionId;

                        return (
                          <div
                            key={questionId}
                            className="border-b border-[#eeeae5] last:border-b-0"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenQuestion(isOpen ? null : questionId)
                              }
                              aria-expanded={isOpen}
                              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-[#faf9f6] sm:px-5"
                            >
                              <span className="text-[11px] font-semibold leading-relaxed sm:text-[12px]">
                                {item.question}
                              </span>

                              <ChevronDown
                                size={16}
                                className={`shrink-0 text-[#a87358] transition-transform duration-200 ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {isOpen && (
                              <div className="px-4 pb-5 sm:px-5">
                                <p className="max-w-[700px] text-[11px] leading-[2] text-[#766c65]">
                                  {item.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#ded6cc] px-5 py-12 text-center">
              <Search size={24} className="mx-auto text-[#a87358]" />
              <h2 className="mt-4 text-[14px] font-bold">
                No matching questions
              </h2>
              <p className="mt-2 text-[11px] text-[#766c65]">
                Try another search or contact our support team.
              </p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 text-[11px] font-bold text-[#a87358] hover:underline"
              >
                Clear search
              </button>
            </div>
          )}

          {}
          <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#100d0b] p-6 text-white sm:flex-row sm:items-center sm:p-8">
            <div>
              <div className="flex items-center gap-2 text-brand">
                <MessageCircle size={16} />
                <span className="text-[10px] font-bold uppercase tracking-[1.5px]">
                  Still need help?
                </span>
              </div>

              <h3 className="mt-3 text-lg font-bold">
                We're happy to help.
              </h3>

              <p className="mt-2 text-[11px] text-[#a49a91]">
                Get in touch with our team for further assistance.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#bd8b70] px-5 py-3 text-[11px] font-bold text-white transition hover:bg-[#a87358]"
            >
              Contact Us
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
