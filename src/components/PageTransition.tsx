"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  return (
    <main key={pathname} className={className}>
      {children}
    </main>
  );
}
