"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { getSafeRedirect } from "@/features/auth/components/utils";

export default function LoginRedirectPage() {
  return (
    <Suspense fallback={<Status />}>
      <GoogleRedirect />
    </Suspense>
  );
}

function Status() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
      <p className="font-sora text-sm font-semibold">Signing you in with Google...</p>
      <p className="text-xs text-muted-foreground">Please wait a moment.</p>
    </div>
  );
}

function GoogleRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const destination = getSafeRedirect(searchParams.get("redirect"));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.user) throw new Error("Unable to load user");
        if (cancelled) return;

        setUser(data.user);
        router.replace(destination);
        router.refresh();
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [destination, router, setUser]);

  if (!failed) return <Status />;

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive">
        We couldn&apos;t complete your Google sign-in. Please try again.
      </p>
      <Button type="button" className="h-11 w-full" onClick={() => router.replace("/auth/login")}>
        Back to Sign In
      </Button>
    </div>
  );
}
