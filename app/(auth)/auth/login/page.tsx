"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, LockOpen, Mail } from "lucide-react";

import type { AuthField } from "@/types";
import { Button } from "@/components/ui/button";


import { useAuthStore } from "@/store/authStore";
import GoogleButton from "@/features/auth/components/GoogleButton";
import AuthInput from "@/features/auth/components/AuthInput";
import { getSafeRedirect, OAUTH_ERROR_MESSAGES } from "@/features/auth/components/utils";

const FIELDS: AuthField[] = [
  {
    name: "email",
    label: "Email Address",
    type: "email",
    icon: Mail,
    placeholder: "you@example.com",
    autoComplete: "email",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    icon: LockOpen,
    placeholder: "Enter your password",
    autoComplete: "current-password",
    linkLabel: "Forgot password?",
    linkHref: "/auth/forgot-password",
  },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading...
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  const redirect = getSafeRedirect(searchParams.get("redirect"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => OAUTH_ERROR_MESSAGES[searchParams.get("error") ?? ""] ?? "");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.user) {
        setError(data?.error || "Unable to sign in. Please try again.");
        return;
      }

      setUser(data.user);
      router.replace(redirect);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="font-sora text-2xl font-bold sm:text-2xl">Welcome Back</h2>
        <p className="mt-2 font-worksans text-xs text-ink">Sign in to your ChunkNChop account</p>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {FIELDS.map((field) => (
          <AuthInput key={field.name} {...field} value={formData[field.name as keyof typeof formData]} onChange={handleInputChange} />
        ))}
        <Button type="submit" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <fieldset className="my-7 border-0 border-t border-sand">
        <legend className="mx-auto px-3 text-xs font-medium tracking-wide text-ink uppercase">Or</legend>
      </fieldset>

      <GoogleButton next={redirect} disabled={loading} />

      <div className="mt-6 text-center">
        <p className="font-sora text-xs text-charcoal">
          New to ChunkNChop?{" "}
          <Link className="font-bold text-brand" href="/auth/signup">
            Create Account
          </Link>
        </p>
      </div>
    </>
  );
}
