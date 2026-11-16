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
type ConversationResponse = { canChat: boolean; counterpartName: string; messages: ChatMessage[] };

async function fetchConversation(url: string): Promise<ConversationResponse> {
  const response = await fetch(url, { cache: 'no-store' });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'Could not load order messages.');
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
    { refreshInterval: (latest) => (latest?.canChat ? 5_000 : 0) },
  );
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState('');
  const messageList = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageList.current?.scrollTo({ top: messageList.current.scrollHeight, behavior: 'smooth' });
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
      if (!response.ok) throw new Error(result?.error || 'Message could not be sent.');
      setDraft('');
      await mutate();
    } catch (sendError) {
      setMessageError(
        sendError instanceof Error ? sendError.message : 'Message could not be sent.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className="order-panel order-conversation"
      aria-labelledby={`conversation-title-${orderNumber}`}
    >
      <div className="order-panel-heading">
        <div>
          <p className="eyebrow">
            <span /> ORDER MESSAGES
          </p>
          <h2 id={`conversation-title-${orderNumber}`}>
            {data?.counterpartName
              ? `With ${data.counterpartName}.`
              : 'Message your delivery partner.'}
          </h2>
        </div>
        <MessageCircle size={18} />
      </div>
      {error ? (
        <p className="order-chat-feedback" role="alert">
          {error.message}
        </p>
      ) : !data ? (
        <p className="order-chat-locked">Loading private order messages…</p>
      ) : (
        <>
          <div
            className="order-chat-messages"
            ref={messageList}
            role="log"
            aria-label="Order conversation"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {data.messages.length === 0 ? (
              <p className="order-chat-empty">A quick note can help your delivery go smoothly.</p>
            ) : (
              data.messages.map((message) => (
                <article
                  key={message.id}
                  className={`order-chat-message ${message.senderRole === viewer ? 'is-mine' : 'is-theirs'}`}
                >
                  <span>
                    {message.senderName} ·{' '}
                    {new Date(message.createdAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  <p>{message.message}</p>
                </article>
              ))
            )}
          </div>
          {!data.canChat ? (
            <p className="order-chat-locked">
              Messaging is closed for this order. You can still review previous messages.
            </p>
          ) : (
            <>
              {messageError && (
                <p className="order-chat-feedback" role="alert">
                  {messageError}
                </p>
              )}
              <form className="order-chat-form" onSubmit={sendMessage}>
                <label className="sr-only" htmlFor={`message-${orderNumber}`}>
                  Message your {viewer === 'customer' ? 'rider' : 'customer'}
                </label>
                <input
                  id={`message-${orderNumber}`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={1000}
                  placeholder="Write a message…"
                  disabled={sending}
                />
                <button type="submit" aria-label="Send message" disabled={sending || !draft.trim()}>
                  {sending ? (
                    <LoaderCircle className="auth-spinner" size={16} />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </form>
              <p className="order-chat-note">Private to this order · refreshes every 5 seconds</p>
            </>
          )}
        </>
      )}
    </section>
  );
}
