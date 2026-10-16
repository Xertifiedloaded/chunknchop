"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import google from "@/assets/google.png";
import { Button } from "@/components/ui/button";

interface GoogleButtonProps {
  role?: "CUSTOMER" | "SUPPLIER";
  next?: string;
  disabled?: boolean;
  label?: string;
}

export default function GoogleButton({ role = "CUSTOMER", next = "/", disabled, label = "Continue with Google" }: GoogleButtonProps) {
  const [redirecting, setRedirecting] = useState(false);

  
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setRedirecting(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const handleClick = () => {
    setRedirecting(true);
    window.location.assign(`/api/auth/google?${new URLSearchParams({ role, next })}`);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled || redirecting}
      className="h-11 w-full border-[#E5E7EB] bg-white text-sm font-bold text-charcoal transition-all hover:bg-gray-50 hover:text-charcoal"
    >
      {redirecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Image src={google} alt="" width={18} height={18} className="mr-2" />}
      {redirecting ? "Redirecting to Google..." : label}
    </Button>
  );
}