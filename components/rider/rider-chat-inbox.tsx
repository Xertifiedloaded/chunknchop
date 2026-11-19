'use client';

import { useMemo, useState } from 'react';
import OrderConversation from '@/components/orders/order-conversation';
import {
  MessageCircle,
  X,
  Search,
  ArrowLeft,
  ChevronRight,
  Package,
  UserRound,
  Phone,
} from 'lucide-react';

type RiderChatOrder = {
  orderNumber: string;
  status?: string;
  customerName?: string;
  paymentStatus?: string;
  delivery?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    area?: string;
    city?: string;
    region?: string;
  };
};

type Props = {
  orders: RiderChatOrder[];
  open: boolean;
  onClose: () => void;
};

function getCustomerName(order: RiderChatOrder) {
  return order.delivery?.fullName || order.customerName || 'Customer';
}

function getOrderAddress(order: RiderChatOrder) {
  return [
    order.delivery?.addressLine1,
    order.delivery?.addressLine2,
    order.delivery?.area,
    order.delivery?.city,
    order.delivery?.region,
  ]
    .filter(Boolean)
    .join(', ');
}

export default function RiderChatInbox({ orders, open, onClose }: Props) {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const conversations = useMemo(
    () =>
      [...orders]
        .filter((order) => order.status !== 'cancelled')
        .sort((a, b) => {
          const active = ['assigned', 'picked_up', 'out_for_delivery'];

          return Number(active.includes(b.status ?? '')) - Number(active.includes(a.status ?? ''));
        }),
    [orders],
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter((order) => {
      return (
        getCustomerName(order).toLowerCase().includes(query) ||
        order.orderNumber.toLowerCase().includes(query) ||
        (order.delivery?.phone ?? '').toLowerCase().includes(query) ||
        getOrderAddress(order).toLowerCase().includes(query)
      );
    });
  }, [conversations, search]);

  const activeOrder = conversations.find((order) => order.orderNumber === selectedOrder);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#211a13]/45 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-label="Customer messages inbox"
        role="dialog"
        aria-modal="true"
        className="flex h-[min(650px,calc(100dvh-24px))] w-full max-w-[850px] flex-col overflow-hidden rounded-2xl border border-[#e9e2d8] bg-white shadow-[0_20px_80px_rgba(35,25,15,0.25)]"
      >
        <div className="flex h-[58px] shrink-0 items-center justify-between bg-[#29231e] px-3.5 text-white sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <MessageCircle className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold">Customer messages</p>
              <p className="mt-0.5 text-[9px] text-white/55">
                {conversations.length} order conversations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close inbox"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside
            className={`w-full shrink-0 flex-col border-r border-[#eee9e2] bg-[#fdfcfb] sm:w-[270px] ${
              selectedOrder ? 'hidden sm:flex' : 'flex'
            }`}
          >
            <div className="border-b border-[#eee9e2] p-3">
              <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#82796e]">
                All conversations
              </p>

              <div className="flex h-8 items-center gap-2 rounded-lg border border-[#eae5dc] bg-white px-2.5 focus-within:border-[#c49a6c]">
                <Search className="h-3 w-3 shrink-0 text-[#a39a8e]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customers or orders..."
                  className="min-w-0 flex-1 bg-transparent text-[10px] text-[#393129] outline-none placeholder:text-[#aaa39a]"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredConversations.length ? (
                filteredConversations.map((order) => {
                  const isSelected = selectedOrder === order.orderNumber;
                  const name = getCustomerName(order);
                  const address = getOrderAddress(order);

                  return (
                    <button
                      type="button"
                      key={order.orderNumber}
                      onClick={() => setSelectedOrder(order.orderNumber)}
                      className={`flex w-full items-center gap-2.5 border-b border-[#f0ece6] px-3 py-3 text-left transition ${
                        isSelected ? 'bg-[#f5eee5]' : 'bg-transparent hover:bg-[#f8f5f0]'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${
                          isSelected ? 'bg-[#29231e] text-white' : 'bg-[#f0e9df] text-[#906c48]'
                        }`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[10px] font-bold text-[#393129]">
                            {name}
                          </span>
                          <ChevronRight className="h-3 w-3 shrink-0 text-[#a79c8e]" />
                        </span>

                        <span className="mt-1 block truncate text-[9px] text-[#92887d]">
                          {order.orderNumber}
                        </span>

                        <span className="mt-1 block truncate text-[9px] text-[#aaa096]">
                          {address || 'Order conversation'}
                        </span>

                        <span className="mt-1 inline-flex rounded-md bg-white px-1.5 py-0.5 text-[8px] font-semibold capitalize text-[#8b7258]">
                          {(order.status ?? 'pending').replaceAll('_', ' ')}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="px-5 py-12 text-center">
                  <MessageCircle className="mx-auto h-5 w-5 text-[#c0b5a8]" />
                  <p className="mt-3 text-[10px] font-bold text-[#554c42]">
                    No conversations found
                  </p>
                  <p className="mt-1 text-[9px] leading-5 text-[#9a9186]">
                    Try another customer name or order number.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <main
            className={`min-w-0 flex-1 flex-col bg-white ${
              selectedOrder ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {activeOrder ? (
              <>
                <div className="flex h-[54px] shrink-0 items-center gap-2.5 border-b border-[#eee9e2] px-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    aria-label="Back to conversation list"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#766b5e] hover:bg-[#f6f1ea] sm:hidden"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3ece2] text-[#906c48]">
                    <UserRound className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-bold text-[#393129]">
                      {getCustomerName(activeOrder)}
                    </p>
                    <p className="mt-0.5 truncate text-[9px] text-[#93897d]">
                      {activeOrder.orderNumber}
                    </p>
                  </div>

                  {activeOrder.delivery?.phone && (
                    <a
                      href={`tel:${activeOrder.delivery.phone}`}
                      aria-label="Call customer"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#eee9e2] text-[#8c6a46] transition hover:bg-[#f7f2eb]"
                    >
                      <Phone className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
                  <OrderConversation
                    key={activeOrder.orderNumber}
                    orderNumber={activeOrder.orderNumber}
                    viewer="rider"
                  />
                </div>

                <div className="flex shrink-0 items-center gap-2 border-t border-[#eee9e2] bg-[#fdfcfb] px-3 py-2">
                  <Package className="h-3 w-3 text-[#a17443]" />
                  <p className="min-w-0 truncate text-[9px] text-[#8d8378]">
                    Private conversation for order{' '}
                    <span className="font-semibold text-[#51483e]">{activeOrder.orderNumber}</span>
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5eee4] text-[#a17443]">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <p className="mt-3 text-[11px] font-bold text-[#393129]">Select a conversation</p>
                <p className="mt-1.5 max-w-[220px] text-[9px] leading-5 text-[#92887d]">
                  Choose a customer to view their messages and send a reply.
                </p>
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
