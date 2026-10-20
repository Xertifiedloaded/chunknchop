"use client";

import Link from "next/link";
import { useState } from "react";
import type { Meatbox, SectionCopy } from "@/lib/cms/defaults";

async function addToCart(productId: string, quantity = 1) {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  if (res.status === 401) {
    window.location.href = `/login?next=${encodeURIComponent("/#meatbox")}`;
    return false;
  }
  return res.ok;
}

export function MeatboxSection({ copy, boxes }: { copy: SectionCopy; boxes: Meatbox[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  async function onAdd(box: Meatbox) {
    if (!box.productId) return;
    setBusy(box.id);
    const ok = await addToCart(box.productId);
    setBusy(null);
    if (ok) {
      setAdded(box.id);
      setTimeout(() => setAdded(null), 2000);
    }
  }

  return (
    <section id="meatbox">
      {copy.eyebrow && <p>{copy.eyebrow}</p>}
      <h2>{copy.heading}</h2>
      {copy.subtext && <p>{copy.subtext}</p>}

      <div>
        {boxes.map((box) => (
          <article key={box.id} data-featured={box.featured}>
            {box.image && <img src={box.image} alt={box.title} />}
            <span>{box.label}</span>
            <h3>{box.title}</h3>
            <p>{box.contents}</p>
            <p>₦{box.price.toLocaleString("en-NG")}</p>

            {box.productId ? (
              <button disabled={busy === box.id || box.inStock === false} onClick={() => onAdd(box)}>
                {box.inStock === false
                  ? "SOLD OUT"
                  : added === box.id
                  ? "ADDED ✓"
                  : busy === box.id
                  ? "ADDING..."
                  : copy.buttonLabel ?? "ADD MEATBOX TO CART"}
              </button>
            ) : (
              <Link href={box.link ?? "/shop?category=meatbox"}>VIEW</Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}