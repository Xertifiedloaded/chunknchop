"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, LockOpen, Mail, User } from "lucide-react";

import type { AuthField } from "@/types";
import AuthInput from "@/features/auth/components/AuthInput";
import GoogleButton from "@/features/auth/components/GoogleButton";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { getSafeRedirect } from "@/features/auth/components/utils";

type Role = "CUSTOMER" | "SUPPLIER";

const FIELDS: AuthField[] = [
  { name: "name", label: "Full Name", type: "text", icon: User, placeholder: "Your name", autoComplete: "name" },
  { name: "email", label: "Email Address", type: "email", icon: Mail, placeholder: "you@example.com", autoComplete: "email" },
  {
    name: "password",
    label: "Password",
    type: "password",
    icon: LockOpen,
    placeholder: "Create a password",
    autoComplete: "new-password",
    hint: "8 to 72 characters",
  },
];

export default function SignupPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignupForm />
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

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const redirect = getSafeRedirect(searchParams.get("redirect"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password.length < 8 || formData.password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.user) {
        setError(data?.error === "Invalid input" ? "Please check your details and try again." : data?.error || "Unable to create account. Please try again.");
        return;
      }

      setUser(data.user);
      router.replace(redirect);
      router.refresh();
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="font-sora text-2xl font-bold sm:text-2xl">Create Account</h2>
        <p className="mt-2 font-worksans text-xs text-ink">Join ChunkNChop today</p>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <div role="radiogroup" aria-label="Account type" className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-[#F3F4F6] p-1">
        {(["CUSTOMER", "SUPPLIER"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={role === value}
            onClick={() => setRole(value)}
            className={`h-9 rounded-md text-xs font-semibold transition-all ${role === value ? "bg-white text-charcoal shadow-sm" : "text-muted-foreground hover:text-charcoal"}`}
          >
            {value === "CUSTOMER" ? "I'm a Customer" : "I'm a Supplier"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {FIELDS.map((field) => (
          <AuthInput key={field.name} {...field} value={formData[field.name as keyof typeof formData]} onChange={handleInputChange} />
        ))}
        <Button type="submit" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <fieldset className="my-7 border-0 border-t border-sand">
        <legend className="mx-auto px-3 text-xs font-medium tracking-wide text-ink uppercase">Or</legend>
      </fieldset>

      <GoogleButton role={role} next={redirect} disabled={loading} label="Sign up with Google" />

      <div className="mt-6 text-center">
        <p className="font-sora text-xs text-charcoal">
          Already have an account?{" "}
          <Link className="font-bold text-brand" href="/auth/login">
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}
