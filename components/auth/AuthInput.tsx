import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

import type { AuthField } from '@/lib/types';

interface AuthInputProps extends AuthField {
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AuthInput({ name, label, type, icon: Icon, placeholder, autoComplete, hint, linkLabel, linkHref, value, error, onChange }: AuthInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-xs font-medium">
          {label}
        </label>

        {linkLabel && linkHref && (
          <Link href={linkHref} className="text-primary text-xs font-medium hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>

      <div className="relative rounded-md border border-[#E5E7EB] bg-[#F9FAFB]">
        {Icon && <Icon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />}
        <Input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} className="h-11 border-0 bg-transparent pl-10 shadow-none ring-0 outline-none placeholder:text-xs focus:border-0 focus:ring-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none" required />
      </div>

      {hint && !error && <p className="text-brand text-xs">{hint}</p>}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
