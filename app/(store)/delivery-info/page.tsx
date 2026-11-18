import Link from 'next/link';

const deliverySteps = [
  {
    number: '01',
    title: 'Place Your Order',
    description:
      'Browse our products, select your preferred cuts and quantities, and complete checkout.',
  },
  {
    number: '02',
    title: 'Order Preparation',
    description:
      'Your order is received and prepared according to the items and quantities you selected.',
  },
  {
    number: '03',
    title: 'Dispatch',
    description:
      'Once your order is ready, it is handed over for delivery to your provided address.',
  },
  {
    number: '04',
    title: 'Receive Your Order',
    description:
      'Our delivery team brings your order to your delivery address. Please ensure someone is available to receive it.',
  },
];

const deliveryFAQs = [
  {
    question: 'How long does delivery take?',
    answer:
      'Delivery time depends on your location, order preparation and dispatch availability. Your expected delivery information should be confirmed during checkout or by our customer support team.',
  },
  {
    question: 'How much does delivery cost?',
    answer:
      'Delivery charges may vary depending on your delivery location and order. The applicable delivery fee will be shown during checkout before you complete payment.',
  },
  {
    question: 'Can I track my order?',
    answer:
      'You can check your order status through your account if order tracking is available. You can also contact customer support with your order number for assistance.',
  },
  {
    question: 'Can I change my delivery address?',
    answer:
      'If you need to update your delivery address, contact our support team as soon as possible. Address changes may not be possible once an order has been dispatched.',
  },
  {
    question: 'What happens if I am unavailable?',
    answer:
      'Please make sure someone is available at the delivery address to receive your order. Contact our support team if you anticipate a problem receiving your delivery.',
  },
  {
    question: 'What should I do if my order arrives with an issue?',
    answer:
      'Contact us as soon as possible and provide your order number, a description of the issue and photographs where relevant so our team can review it.',
  },
];

export default function DeliveryInfoPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#faf9f6] text-[#201a17]">
      {}
      <section className="relative overflow-hidden bg-[#100d0b] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12">
        <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-[#a45d3d]/15 blur-[100px]" />

        <div className="relative mx-auto max-w-[1100px]">
          <span className="text-[10px] font-bold uppercase tracking-[2px] text-brand">
            ChunkNChop Delivery
          </span>

          <h1 className="mt-4 max-w-[700px] text-4xl font-black leading-tight tracking-[-1.5px] sm:text-5xl">
            From our preparation
            <span className="block text-brand">to your doorstep.</span>
          </h1>

          <p className="mt-5 max-w-[470px] text-[12px] leading-[2] text-[#b4a69d]">
            Everything you need to know about ordering, delivery, receiving your products and
            getting support from ChunkNChop.
          </p>

          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-brand px-6 py-3.5 text-[11px] font-bold text-white transition hover:bg-[#a87358]"
          >
            Start Shopping
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {}
      <section className="px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1100px] gap-8 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#a87358]">
              Our Delivery Process
            </span>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.8px] sm:text-3xl">
              A simple way to get your order.
            </h2>

            <p className="mt-4 text-[11px] leading-[2] text-[#766c65]">
              At ChunkNChop, we want ordering your preferred meat products to be straightforward.
              From checkout to delivery, we aim to keep you informed about your order.
            </p>

            <p className="mt-3 text-[11px] leading-[2] text-[#766c65]">
              Delivery availability, charges and estimated arrival times depend on your location and
              the details of your order.
            </p>
          </div>

          <div className="rounded-2xl bg-[#f0ede8] p-6 sm:p-8">
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#a87358]">
              Before You Order
            </span>

            <h3 className="mt-3 text-xl font-black">Check your delivery details.</h3>

            <ul className="mt-5 space-y-4">
              {[
                'Enter a complete and accurate delivery address.',
                'Provide a reachable phone number.',
                'Check the delivery fee before payment.',
                'Make sure someone can receive your order.',
              ].map((item, index) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[10px] font-bold text-[#a87358]">
                    {index + 1}
                  </span>
                  <span className="text-[11px] leading-[1.8] text-[#665b54]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {}
      <section className="bg-white px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="max-w-[550px]">
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#a87358]">
              How It Works
            </span>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.8px] sm:text-3xl">
              Four steps to your doorstep.
            </h2>

            <p className="mt-3 text-[11px] leading-[2] text-[#766c65]">
              Here is what happens after you place an order with us.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {deliverySteps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-[#eae5de] bg-[#faf9f6] p-5"
              >
                <span className="text-3xl font-black tracking-[-1px] text-brand">
                  {step.number}
                </span>

                <h3 className="mt-5 text-[13px] font-bold">{step.title}</h3>

                <p className="mt-2 text-[10px] leading-[1.9] text-[#81766e]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#a87358]">
            Important Information
          </span>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.8px] sm:text-3xl">
            A few things to keep in mind.
          </h2>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#eae5de] bg-white p-5">
              <h3 className="text-[13px] font-bold">Delivery Address</h3>
              <p className="mt-2 text-[11px] leading-[1.9] text-[#81766e]">
                Double-check your address and contact details before confirming your order to help
                avoid delivery delays.
              </p>
            </div>

            <div className="rounded-2xl border border-[#eae5de] bg-white p-5">
              <h3 className="text-[13px] font-bold">Receiving Your Order</h3>
              <p className="mt-2 text-[11px] leading-[1.9] text-[#81766e]">
                Arrange for someone to be available at the delivery address to receive and check
                your order.
              </p>
            </div>

            <div className="rounded-2xl border border-[#eae5de] bg-white p-5">
              <h3 className="text-[13px] font-bold">Order Issues</h3>
              <p className="mt-2 text-[11px] leading-[1.9] text-[#81766e]">
                If anything is wrong with your delivery, contact our support team with your order
                details as soon as possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="bg-white px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[850px]">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#a87358]">
              Delivery Questions
            </span>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.8px] sm:text-3xl">
              Frequently asked questions.
            </h2>
          </div>

          <div className="mt-9 space-y-3">
            {deliveryFAQs.map((faq, index) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-[#eae5de] bg-[#faf9f6] p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[12px] font-bold marker:hidden">
                  <span>{faq.question}</span>

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm text-[#a87358] transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-[720px] text-[11px] leading-[2] text-[#81766e]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-6 rounded-2xl bg-[#100d0b] p-7 text-white sm:p-10 md:flex-row md:items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-brand">
              Need Assistance?
            </span>

            <h2 className="mt-3 text-xl font-black sm:text-2xl">We're here to help.</h2>

            <p className="mt-2 max-w-[420px] text-[11px] leading-[1.9] text-[#b4a69d]">
              Have a question about your delivery or an existing order? Get in touch with our
              support team.
            </p>
          </div>

          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center gap-3 rounded-full bg-brand px-6 py-3.5 text-[11px] font-bold text-white transition hover:bg-[#a87358]"
          >
            Contact Support
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
