"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0f0b0a] px-6 py-12 lg:px-12">
      <div className="mx-auto grid max-w-271 gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-black tracking-[-1px]">
            ChunkN <span className="text-[#b9aaa0]">CHOP</span>
          </div>

          <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-[#9b8e83]">Fresh meat, cut to order and delivered cold.</p>
        </div>

        <div>
          <b className="block text-sm tracking-[1px] text-[#a99b90]">SHOP</b>

          <div className="mt-3 space-y-2 text-sm text-[#9b8e83]">
            <div>BEEF</div>
            <div>GOAT & LAMB</div>
            <div>CHICKEN</div>
            <div>MEATBOX</div>
          </div>
        </div>

        <div>
          <b className="block text-sm tracking-[1px] text-[#a99b90]">HELP</b>

          <div className="mt-3 space-y-2 text-sm text-[#9b8e83]">
            <div>DELIVERY INFO</div>
            <div>FAQS</div>
            <div>CONTACT</div>
          </div>
        </div>

        <div>
          <b className="block text-sm tracking-[1px] text-[#a99b90]">CONTACT</b>

          <div className="mt-3 space-y-2 text-sm text-[#9b8e83]">
            <div>[PHONE]</div>
            <div>[EMAIL]</div>
            <div>24/7 Support</div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-271 border-t border-white/5 pt-5 text-center text-sm text-[#6c615a]">© ChunNchop. All rights reserved.</div>
    </footer>
  );
}
