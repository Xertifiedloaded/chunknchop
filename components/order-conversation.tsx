
'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import useSWR from 'swr';
import { LoaderCircle, MessageCircle, Send } from 'lucide-react';

type ChatMessage = {
  id: string;
  senderRole: 'customer' | 'rider';
  senderName: string;
  message: string;
  createdAt: string;
};

type ConversationResponse = {
  canChat: boolean;
  counterpartName: string;
  messages: ChatMessage[];
};

async function fetchConversation(url: string): Promise<ConversationResponse> {
  const response = await fetch(url, { cache: 'no-store' });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || 'Could not load order messages.');
  }

  return result;
}

export default function OrderConversation({
  orderNumber,
  viewer,
  enabled = true,
}: {
  orderNumber: string;
  viewer: 'customer' | 'rider';
  enabled?: boolean;
}) {
  const url = `/api/orders/${encodeURIComponent(orderNumber)}/messages`;

  const { data, error, mutate } = useSWR<ConversationResponse>(
    enabled ? url : null,
    fetchConversation,
    {
      refreshInterval: (latest) => (latest?.canChat ? 5_000 : 0),
    },
  );

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState('');

  const messageList = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageList.current?.scrollTo({
      top: messageList.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [data?.messages.length]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = draft.trim();

    if (!message || sending) return;

    setSending(true);
    setMessageError('');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Message could not be sent.');
      }

      setDraft('');
      await mutate();
    } catch (sendError) {
      setMessageError(
        sendError instanceof Error
          ? sendError.message
          : 'Message could not be sent.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className="overflow-hidden border border-[#e6e4de] bg-white"
      aria-labelledby={`conversation-title-${orderNumber}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-[#e6e4de] px-5 py-5 sm:px-6">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#e86b3e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
            ORDER MESSAGES
          </p>

          <h2
            id={`conversation-title-${orderNumber}`}
            className="font-heading text-lg font-semibold leading-snug text-[#24231f] sm:text-xl"
          >
            {data?.counterpartName
              ? `With ${data.counterpartName}.`
              : 'Message your delivery partner.'}
          </h2>
        </div>

        <MessageCircle
          size={18}
          className="shrink-0 text-[#e86b3e]"
        />
      </div>

      {error ? (
        <p
          className="m-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error.message}
        </p>
      ) : !data ? (
        <p className="px-5 py-8 text-center text-sm text-[#88847d]">
          Loading private order messages…
        </p>
      ) : (
        <>
          <div
            className="flex max-h-[360px] min-h-[180px] flex-col gap-4 overflow-y-auto bg-[#faf9f6] px-4 py-5 sm:px-6"
            ref={messageList}
            role="log"
            aria-label="Order conversation"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {data.messages.length === 0 ? (
              <p className="m-auto max-w-xs text-center text-sm leading-6 text-[#88847d]">
                A quick note can help your delivery go smoothly.
              </p>
            ) : (
              data.messages.map((message) => {
                const isMine = message.senderRole === viewer;

                return (
                  <article
                    key={message.id}
                    className={`flex max-w-[85%] flex-col gap-1 sm:max-w-[75%] ${
                      isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <span className="px-1 text-[10px] text-[#88847d]">
                      {message.senderName} ·{' '}
                      {new Date(message.createdAt).toLocaleTimeString(
                        'en-US',
                        {
                          hour: 'numeric',
                          minute: '2-digit',
                        },
                      )}
                    </span>

                    <p
                      className={`break-words rounded-sm px-4 py-3 text-sm leading-6 ${
                        isMine
                          ? 'bg-[#e86b3e] text-white'
                          : 'border border-[#e6e4de] bg-white text-[#332925]'
                      }`}
                    >
                      {message.message}
                    </p>
                  </article>
                );
              })
            )}
          </div>

          {!data.canChat ? (
            <p className="border-t border-[#e6e4de] px-5 py-4 text-xs leading-5 text-[#88847d] sm:px-6">
              Messaging is closed for this order. You can still review previous
              messages.
            </p>
          ) : (
            <>
              {messageError && (
                <p
                  className="mx-5 mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6"
                  role="alert"
                >
                  {messageError}
                </p>
              )}

              <form
                className="flex items-center gap-2 border-t border-[#e6e4de] p-4 sm:px-6"
                onSubmit={sendMessage}
              >
                <label
                  className="sr-only"
                  htmlFor={`message-${orderNumber}`}
                >
                  Message your {viewer === 'customer' ? 'rider' : 'customer'}
                </label>

                <input
                  id={`message-${orderNumber}`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={1000}
                  placeholder="Write a message…"
                  disabled={sending}
                  className="min-w-0 flex-1 border border-[#e6e4de] bg-[#faf9f6] px-4 py-3 text-sm text-[#332925] outline-none transition-colors placeholder:text-[#aaa69f] focus:border-[#e86b3e] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={sending || !draft.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#e86b3e] text-white transition-colors hover:bg-[#a9442c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? (
                    <LoaderCircle
                      className="animate-spin"
                      size={16}
                    />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </form>

              <p className="px-5 pb-4 text-[10px] tracking-wide text-[#99958e] sm:px-6">
                Private to this order · refreshes every 5 seconds
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}
