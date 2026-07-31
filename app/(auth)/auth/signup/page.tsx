'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, Mail, User, Store } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import AuthInput, { AuthField } from '@/components/auth/AuthInput';
import Image from 'next/image';
import google from '../../../../assets/google.png';
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
      <div className="mb-7 text-center">
        <h2 className="font-sora text-2xl font-bold sm:text-2xl">Create Your Account</h2>

        <p className="text-muted-foreground mt-2 text-xs">Join ChunkNChop and start shopping today</p>
      </div>
      {errors.form && (
        <div role="alert" className="border-destructive/20 bg-destructive/10 text-destructive mb-5 rounded-lg border px-4 py-3 text-sm">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Account Type</label>

          <div className="grid grid-cols-2 gap-2">
            <label className={`flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 transition ${formData.role === 'CUSTOMER' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted/40'}`}>
              <input type="radio" name="role" value="CUSTOMER" checked={formData.role === 'CUSTOMER'} onChange={handleInputChange} className="sr-only" />

              <User className="h-3 w-3 shrink-0" />
              <span className="truncate text-[11px] leading-none font-medium">Customer</span>
            </label>
            <label className={`flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 transition ${formData.role === 'SUPPLIER' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted/40'}`}>
              <input type="radio" name="role" value="SUPPLIER" checked={formData.role === 'SUPPLIER'} onChange={handleInputChange} className="sr-only" />

              <Store className="h-3 w-3 shrink-0" />
              <span className="truncate text-[11px] leading-none font-medium">Supplier</span>
            </label>
          </div>
        </div>
        {FIELDS.map((field) => (
          <AuthInput key={field.name} {...field} value={formData[field.name as keyof typeof formData]} error={errors[field.name]} onChange={handleInputChange} />
        ))}

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
        <fieldset className="border-sand border-0 border-t">
          <legend className="text-ink mx-auto px-3 text-xs font-medium tracking-wide uppercase">Or</legend>
        </fieldset>
        <Button type="button" variant="outline" className="text-charcoal hover:text-charcoal animate-out h-11 w-full border-[#E5E7EB] bg-white text-sm font-bold transition-all hover:bg-gray-50">
          <Image src={google} alt="Google" width={18} height={18} className="mr-2" />
          Continue with Google
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-charcoal font-sora text-xs">
          Already have an account?{' '}
          <Link className="text-brand font-bold" href="/auth/login">
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}
