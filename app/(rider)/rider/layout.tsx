import type { ReactNode } from "react";

// Rider portal shell. Replace with the rider header / bottom nav / auth guard.
export default function RiderLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
