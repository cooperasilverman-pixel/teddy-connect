"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

interface AppNavProps {
  parentName: string;
  onLogout: () => void;
}

const TABS = [
  { label: "Home", href: "/dashboard" },
  { label: "Find Friends", href: "/dashboard/find-friends" },
  { label: "Resources", href: "/dashboard/resources" },
];

export default function AppNav({ parentName, onLogout }: AppNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Teddy Connect" width={40} height={40} />
          <span className="text-xl font-bold text-green-600">Teddy Connect</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 dark:text-gray-300">Hi, {parentName}</span>
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Log out
          </button>
        </div>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-1 px-6 max-w-6xl mx-auto">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 pt-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                isActive(tab.href)
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
