
"use client";

import Link from "next/link";
import { useCmsContent } from "@/lib/cms/useCmsContent";

export default function CmsBanner({ placement = "TOP_BAR" }: { placement?: "TOP_BAR" | "HOME_MID" | "SHOP_TOP" }) {
  const { data } = useCmsContent(["BANNER"]);
  const banner = data.BANNER?.find((b) => b.data.placement === placement);
  if (!banner) return null;

  const text = <span className="text-xs font-black tracking-wide">{banner.data.text}</span>;
  return (
    <div className="bg-brand px-4 py-2 text-center text-white">
      {banner.data.link ? (
        <Link href={banner.data.link} className="hover:underline">
          {text}
        </Link>
      ) : (
        text
      )}
    </div>
  );
}