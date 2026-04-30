"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`relative flex items-center w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${
        dark ? "bg-indigo-500" : "bg-gray-300"
      }`}
    >
      <span className={`absolute left-1 text-sm transition-transform duration-300 ${dark ? "translate-x-7" : "translate-x-0"}`}>
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
