
'use client';

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import {
  Check,
  Clock3,
  MapPin,
  PackageCheck,
} from 'lucide-react';

import OrderChat from '@/components/delivery/order-chat';

type Props = {
  orderNumber: string;
  paymentNotice?: string;
};

type Tracking = {
  id?: string;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  items?: {
    name: string;
    imageUrl?: string | null;
    quantity?: number;
  }[];
  rider?: {
    name?: string;
    location?: {
      latitude: number;
      longitude: number;
      updatedAt: string;
    };
  } | null;
};

const steps = [
  {
    key: 'payment_pending',
    label: 'Order received',
    description: 'Your order is reserved while payment is confirmed.',
  },
  {
    key: 'paid',
    label: 'Payment confirmed',
    description: 'The counter is preparing your order.',
  },
  {
    key: 'assigned',
    label: 'Rider assigned',
    description: 'Your delivery partner is ready.',
  },
  {
    key: 'picked_up',
    label: 'Picked up',
    description: 'Your order has left the counter.',
  },
  {
    key: 'out_for_delivery',
    label: 'On the way',
    description: 'Your rider is heading to your address.',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Enjoy your order.',
  },
];

const statusStyles: Record<string, string> = {
  payment_pending: 'border-[#e9d7c7] bg-[#f8f1eb] text-[#a9442c]',
  paid: 'border-[#dce5d5] bg-[#eff2e9] text-[#53623f]',
  assigned: 'border-[#e9d7c7] bg-[#f8f1eb] text-[#a9442c]',
  picked_up: 'border-[#e9d7c7] bg-[#f8f1eb] text-[#a9442c]',
  out_for_delivery: 'border-[#e9d7c7] bg-[#f8f1eb] text-[#a9442c]',
  delivered: 'border-[#dce5d5] bg-[#eff2e9] text-[#53623f]',
  cancelled: 'border-[#e6e4de] bg-[#f1efeb] text-[#77736d]',
};

export default function OrderTracking({ orderNumber }: Props) {
  const [data, setData] = useState<Tracking>({});
  const [error, setError] = useState('');

  async function refresh() {
    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}/tracking`,
        { cache: 'no-store' },
      );

      const result = await response.json();
console.log(result);

      if (response.ok) {
        setData(result);
        setError('');
      } else {
        setError(result.error ?? 'Unable to load tracking');
      }
    } catch {
      setError('Unable to load tracking. Please try again.');
    }
  }

  useEffect(() => {
    void refresh();

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) return;

    const pusher = new Pusher(key, {
      cluster,
      channelAuthorization: {
        endpoint: '/api/pusher/auth',
        transport: 'ajax',
      },
    });

    const channel = pusher.subscribe(`private-order-${orderNumber}`);

    channel.bind(
      'delivery.location',
      (location: {
        latitude: number;
        longitude: number;
        updatedAt: string;
      }) => {
        setData((old) => ({
          ...old,
          rider: {
            ...old.rider,
            location,
          },
        }));
      },
    );

    channel.bind('delivery.status', refresh);
    channel.bind('delivery.assigned', refresh);

    return () => {
      pusher.unsubscribe(`private-order-${orderNumber}`);
      pusher.disconnect();
    };
  }, [orderNumber]);

  const loc = data.rider?.location;

  const mapUrl = loc
    ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
    : undefined;

  const currentIndex = steps.findIndex(
    (step) => step.key === data.status,
  );

  const completed = ['delivered', 'cancelled'].includes(
    data.status ?? '',
  );

  const status = data.status ?? 'payment_pending';
  const orderItem = data.items?.[0];

  return (
    <main className="mx-auto min-h-screen w-[min(1120px,90%)] max-[650px]:w-[92%]">
      <section className="py-[38px] pb-[75px] max-[650px]:py-[25px] max-[650px]:pb-[50px]">

        {}
        <div className="mb-[30px] flex items-end justify-between gap-5 max-[650px]:items-start">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
              <span className="h-px w-[19px] bg-[#e86b3e]" />
              ORDER TRACKING
            </p>

            <h1 className="mt-[15px] mb-[12px] font-heading text-[clamp(38px,4.5vw,55px)] leading-[1.02] tracking-[-0.045em]">
              On its way to <em>you.</em>
            </h1>

            <p className="m-0 text-[11px] leading-[1.7] text-[#77736d]">
              Order {orderNumber}
            </p>

            {}
            <div className="mt-6 flex items-center gap-4 border-t border-[#e6e4de] pt-5">
              <div className="relative size-[76px] shrink-0 overflow-hidden border border-[#e6e4de] bg-[#f8f8f6]">
                {orderItem?.imageUrl ? (
                  <img
                    src={orderItem.imageUrl}
                    alt={orderItem.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[#aaa49a]">
                    <PackageCheck size={25} />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-[8px] font-bold tracking-[0.15em] text-[#88847d]">
                  YOUR ORDER
                </p>

                <h2 className="truncate font-heading text-[19px] font-normal text-[#24231f]">
                  {orderItem?.name ?? 'Loading order details...'}
                </h2>

                {orderItem?.quantity && (
                  <p className="mt-1 text-[9px] text-[#77736d]">
                    Quantity: {orderItem.quantity}
                  </p>
                )}

                <p className="mt-1 text-[9px] leading-[1.6] text-[#77736d]">
                  Order ID:{' '}
                  <span className="font-semibold text-[#24231f]">
                    {data.id ?? orderNumber}
                  </span>
                </p>

                {data.items && data.items.length > 1 && (
                  <p className="mt-1 text-[9px] text-[#88847d]">
                    +{data.items.length - 1} more item(s)
                  </p>
                )}
              </div>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center border px-[10px] py-[8px] text-[8px] font-bold tracking-[0.08em] uppercase ${
              statusStyles[status] ??
              'border-[#e6e4de] bg-[#fbfaf7] text-[#77736d]'
            }`}
          >
            {status.replaceAll('_', ' ')}
          </span>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-[20px] border border-[#e8c9c1] bg-[#f8eae7] px-[15px] py-[13px] text-[10px] text-[#a9442c]"
          >
            {error}
          </p>
        )}

        {}
        <div className="grid grid-cols-[minmax(0,1.65fr)_minmax(260px,0.85fr)] items-start gap-[22px] max-[850px]:grid-cols-1">

          {}
          <section className="flex min-w-0 flex-col gap-[18px]">

            {}
            <article className="border border-[#e6e4de] bg-white p-[22px] max-[650px]:p-[15px]">
              <div className="mb-[22px] flex items-center justify-between gap-4">
                <div>
                  <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
                    <span className="h-px w-[19px] bg-[#e86b3e]" />
                    LIVE STATUS
                  </p>

                  <h2 className="mt-[9px] font-heading text-[24px] font-normal leading-[1.2]">
                    {status === 'delivered'
                      ? 'Delivered with care.'
                      : status === 'cancelled'
                        ? 'Order cancelled.'
                        : 'The journey so far.'}
                  </h2>
                </div>

                <Clock3 className="shrink-0 text-[#a9442c]" size={18} />
              </div>

              <ol className="m-0 list-none p-0">
                {steps.map((step, index) => {
                  if (
                    status === 'cancelled' &&
                    step.key !== 'payment_pending'
                  ) {
                    return null;
                  }

                  const complete =
                    status === 'cancelled'
                      ? index === 0
                      : currentIndex >= index && currentIndex >= 0;

                  const active = index === currentIndex;

                  return (
                    <li
                      key={step.key}
                      className={`relative grid grid-cols-[22px_minmax(0,1fr)] items-start gap-[12px] pb-[25px] last:pb-0 ${
                        index !== steps.length - 1
                          ? 'after:absolute after:top-[22px] after:bottom-0 after:left-[10px] after:w-px after:bg-[#e6e4de]'
                          : ''
                      }`}
                    >
                      <span
                        className={`relative z-[1] grid size-[22px] place-items-center rounded-full border ${
                          complete
                            ? 'border-[#a9442c] bg-[#a9442c] text-white'
                            : 'border-[#dedbd3] bg-[#f8f8f6] text-[#aaa49a]'
                        }`}
                      >
                        {complete ? (
                          <Check size={13} />
                        ) : (
                          <span className="size-[5px] rounded-full bg-current" />
                        )}
                      </span>

                      <div className="min-w-0 pt-[2px]">
                        <strong
                          className={`text-[11px] font-semibold ${
                            complete
                              ? 'text-[#24231f]'
                              : 'text-[#88847d]'
                          }`}
                        >
                          {step.label}
                        </strong>

                        <p className="mt-[5px] mb-0 text-[10px] leading-[1.7] text-[#88847d]">
                          {step.description}
                        </p>

                        {active && !completed && (
                          <span className="mt-2 inline-block text-[8px] font-bold tracking-[0.1em] text-[#a9442c]">
                            CURRENT STATUS
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </article>

            {}
            <article className="border border-[#e6e4de] bg-white p-[22px] max-[650px]:p-[15px]">
              <div className="mb-[17px] flex items-center justify-between gap-4">
                <div>
                  <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
                    <span className="h-px w-[19px] bg-[#e86b3e]" />
                    RIDER LOCATION
                  </p>

                  <h2 className="mt-[9px] font-heading text-[21px] font-normal leading-[1.3]">
                    {data.rider?.name
                      ? loc
                        ? `${data.rider.name} is on the move.`
                        : `${data.rider.name} will share a live location soon.`
                      : 'Your rider will appear here.'}
                  </h2>
                </div>

                <MapPin className="shrink-0 text-[#a9442c]" size={18} />
              </div>

              {loc ? (
                <>
                  <div className="aspect-video overflow-hidden bg-[#f8f8f6]">
                    <iframe
                      title="Rider live location"
                      className="h-full w-full"
                      src={`https://maps.google.com/maps?q=${loc.latitude},${loc.longitude}&z=15&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <p className="mt-[13px] mb-0 text-[9px] leading-[1.6] text-[#88847d]">
                    Last location update:{' '}
                    {new Date(loc.updatedAt).toLocaleString()}
                  </p>

                  <a
                    className="mt-4 inline-flex items-center gap-2 text-[9px] font-bold tracking-[0.08em] text-[#a9442c] underline underline-offset-4"
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    OPEN IN GOOGLE MAPS
                  </a>
                </>
              ) : (
                <div className="grid aspect-video place-items-center bg-[#f8f8f6] px-5 text-center">
                  <div>
                    <MapPin
                      size={25}
                      className="mx-auto mb-3 text-[#c2bcb2]"
                    />

                    <p className="text-[10px] leading-[1.8] text-[#88847d]">
                      Live location will appear here when your rider starts
                      sharing GPS.
                    </p>
                  </div>
                </div>
              )}

              <p className="mt-[13px] mb-0 flex items-center gap-[8px] text-[9px] leading-[1.6] text-[#88847d]">
                <span className="size-[6px] shrink-0 rounded-full bg-[#e86b3e]" />
                Location refreshes automatically while your order is active.
              </p>
            </article>

            {}
            <OrderChat orderNumber={orderNumber} />
          </section>

          {}
          <aside className="flex min-w-0 flex-col gap-[15px]">

            {}
            <article className="border border-[#e6e4de] bg-white p-[19px]">
              <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
                <span className="h-px w-[19px] bg-[#e86b3e]" />
                DELIVERY PARTNER
              </p>

              <h2 className="mt-[12px] mb-[9px] font-heading text-[21px] font-normal">
                {data.rider?.name ?? 'Awaiting assignment'}
              </h2>

              <p className="m-0 text-[10px] leading-[1.9] text-[#77736d]">
                {data.rider?.name
                  ? 'Your delivery partner is handling your order.'
                  : 'Your rider details will appear here once assigned.'}
              </p>
            </article>

            {}
            <article className="border border-[#e6e4de] bg-white p-[19px]">
              <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
                <span className="h-px w-[19px] bg-[#e86b3e]" />
                DELIVERY STATUS
              </p>

              <h2 className="mt-[12px] mb-[9px] font-heading text-[21px] font-normal capitalize">
                {status.replaceAll('_', ' ')}
              </h2>

              <p className="m-0 text-[10px] leading-[1.9] text-[#77736d]">
                {status === 'delivered'
                  ? 'Your order has been delivered. Enjoy!'
                  : status === 'cancelled'
                    ? 'This order has been cancelled.'
                    : 'We will keep you updated as your order progresses.'}
              </p>
            </article>

            {}
            <article className="border border-[#e6e4de] bg-white p-[19px]">
              <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
                <span className="h-px w-[19px] bg-[#e86b3e]" />
                TRACKING DETAILS
              </p>

              <div className="mt-[17px] flex flex-col gap-[13px]">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] text-[#77736d]">
                    Order number
                  </span>

                  <strong className="text-right text-[10px] font-semibold">
                    {orderNumber}
                  </strong>
                </div>

                <div className="flex items-start justify-between gap-3 border-t border-[#e6e4de] pt-[13px]">
                  <span className="text-[10px] text-[#77736d]">
                    Payment status
                  </span>

                  <strong className="text-right text-[10px] font-semibold capitalize">
                    {data.paymentStatus?.replaceAll('_', ' ') ?? 'Pending'}
                  </strong>
                </div>
              </div>
            </article>

            {completed && (
              <a
                href="/shop"
                className="inline-flex min-h-[46px] items-center justify-center gap-[9px] bg-[#292721] px-[12px] text-center text-[8px] font-bold tracking-[0.08em] text-white transition-colors hover:bg-[#a9442c]"
              >
                <PackageCheck size={15} />
                SHOP THE COUNTER
              </a>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
