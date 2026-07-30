'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, Mail, User, Store } from 'lucide-react';

import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import AuthInput, { AuthField } from '@/components/auth/AuthInput';

const FIELDS: AuthField[] = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    icon: User,
    placeholder: 'John Doe',
    autoComplete: 'name',
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    icon: Mail,
    placeholder: 'you@example.com',
    autoComplete: 'email',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    icon: Lock,
    placeholder: 'Create a password',
    autoComplete: 'new-password',
    hint: 'Use at least 6 characters.',
  },
  {
    name: 'passwordConfirm',
    label: 'Confirm Password',
    type: 'password',
    icon: Lock,
    placeholder: 'Confirm your password',
    autoComplete: 'new-password',
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
    <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading...
    </div>
  );
}

function SignupForm() {
  const router = useRouter();

  const { setUser, setAccessToken } = useAuthStore();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'CUSTOMER',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    if (errors.form) {
      setErrors((prev) => ({
        ...prev,
        form: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Please confirm your password';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          form: data?.error || 'Unable to create your account. Please try again.',
        });

        return;
      }

      const { user, accessToken } = data;

      setUser(user);
      setAccessToken(accessToken);

      if (formData.role === 'SUPPLIER') {
        router.push('/supplier/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Signup error:', err);

      setErrors({
        form: 'Something went wrong. Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-7 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Create Your Account</h2>

        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Join ChunkNChop and start shopping today</p>
      </div>

      {/* Form Error */}
      {errors.form && (
        <div role="alert" className="border-destructive/20 bg-destructive/10 text-destructive mb-5 rounded-lg border px-4 py-3 text-sm">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Account Type */}
        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium">
            Account Type
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${formData.role === 'CUSTOMER' ? 'border-primary bg-primary/5 ring-primary ring-1' : 'hover:bg-muted/50'}`}>
              <input type="radio" name="role" value="CUSTOMER" checked={formData.role === 'CUSTOMER'} onChange={handleInputChange} className="sr-only" />

              <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <User className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-medium">Customer</p>
                <p className="text-muted-foreground text-xs">Shop products</p>
              </div>
            </label>

            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${formData.role === 'SUPPLIER' ? 'border-primary bg-primary/5 ring-primary ring-1' : 'hover:bg-muted/50'}`}>
              <input type="radio" name="role" value="SUPPLIER" checked={formData.role === 'SUPPLIER'} onChange={handleInputChange} className="sr-only" />

              <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <Store className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-medium">Supplier</p>
                <p className="text-muted-foreground text-xs">Sell products</p>
              </div>
            </label>
          </div>
        </div>

        {FIELDS.map((field) => (
          <AuthInput key={field.name} {...field} value={formData[field.name as keyof typeof formData]} error={errors[field.name]} onChange={handleInputChange} />
        ))}

        {/* Submit */}
        <Button type="submit" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* Login */}
      <div className="mt-7 border-t pt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}
