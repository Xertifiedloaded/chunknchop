"use client";

import { useEffect } from "react";
import { hydrateSession } from "@/store/authStore";

export default function ClientAuthInit() {
  useEffect(() => {
    hydrateSession().catch(() => null);
  }, []);

  return null;
}
