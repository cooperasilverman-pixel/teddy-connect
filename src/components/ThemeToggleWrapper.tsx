"use client";

import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

export default function ThemeToggleWrapper() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <ThemeToggle />;
}
