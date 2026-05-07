"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ThemeToggle from "./ThemeToggle";

export default function FloatingThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="bg-white dark:bg-gray-800"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        borderRadius: "999px",
        padding: "4px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      }}
    >
      <ThemeToggle />
    </div>,
    document.body
  );
}
