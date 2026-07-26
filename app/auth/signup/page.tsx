'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors above');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account');
      }

      const { user, token } = await response.json();
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);

      toast.success('Account created successfully');
      router.push(formData.role === 'SUPPLIER' ? '/supplier/dashboard' : '/');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="bg-card border-border space-y-6 rounded-lg border p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Join ChunkNChop</h1>
            <p className="text-muted-foreground mt-2">Create your account to start shopping</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Account Type</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="SUPPLIER">Supplier</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Full Name</label>
              <div className="relative">
                <User className="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="pl-10"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="pl-10"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
                <Input
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
              {errors.passwordConfirm && (
                <p className="mt-1 text-sm text-red-500">{errors.passwordConfirm}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-accent text-accent-foreground hover:bg-accent/90 w-full"
            >
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

          <div className="text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-accent hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
