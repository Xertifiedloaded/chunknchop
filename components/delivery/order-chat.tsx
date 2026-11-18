'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Pusher from 'pusher-js';
type Message = {
  id: string;
  senderRole: string;
  senderName: string;
  message: string;
  createdAt: string;
};
export default function OrderChat({ orderNumber }: { orderNumber: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [canChat, setCanChat] = useState(false);
  const [counterpart, setCounterpart] = useState('Your delivery contact');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/messages`, {
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Unable to load messages');
    setCanChat(Boolean(data.canChat));
    setCounterpart(data.counterpartName ?? 'Your delivery contact');
    setMessages(data.messages ?? []);
  }, [orderNumber]);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;
    const pusher = new Pusher(key, {
      cluster,
      channelAuthorization: { endpoint: '/api/pusher/auth', transport: 'ajax' },
    });
    const channel = pusher.subscribe(`private-order-${orderNumber}`);
    channel.bind('chat.message', (message: Message) =>
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      ),
    );
    channel.bind('delivery.assigned', () => {
      void load().catch((e) => setError(e.message));
    });
    channel.bind('delivery.status', () => {
      void load().catch((e) => setError(e.message));
    });
    return () => {
      pusher.unsubscribe(`private-order-${orderNumber}`);
      pusher.disconnect();
    };
  }, [orderNumber, load]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to send message');
      setMessages((current) =>
        current.some((item) => item.id === data.message.id) ? current : [...current, data.message],
      );
      setValue('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-bold">Chat with {counterpart}</h2>
        <p className="mt-1 text-xs text-stone-500">
          Messages are private to this order and its customer and assigned rider.
        </p>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {!canChat ? (
        <p className="mt-4 rounded-lg bg-stone-50 p-4 text-sm text-stone-500">
          Chat becomes available after a rider has been assigned to your paid order.
        </p>
      ) : (
        <>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-xl bg-stone-50 p-3">
            {messages.length ? (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl p-3 text-sm ${m.senderRole === 'customer' ? 'ml-auto bg-[#9b4c2e] text-white' : 'bg-white text-[#24231f]'}`}
                >
                  <p className="mb-1 text-[10px] font-bold opacity-70">{m.senderName}</p>
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p className="mt-1 text-right text-[10px] opacity-60">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-stone-500">
                No messages yet. Send a message to your rider.
              </p>
            )}
          </div>
          <form onSubmit={send} className="mt-3 flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={1000}
              placeholder="Write a message…"
              className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-3 text-sm"
            />
            <button
              disabled={sending || !value.trim()}
              className="rounded-lg bg-[#9b4c2e] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
