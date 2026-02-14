"use client";

import { SessionProvider } from "next-auth/react";
import { SWRProvider } from "@/components/swr-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRProvider>{children}</SWRProvider>
    </SessionProvider>
  );
}
