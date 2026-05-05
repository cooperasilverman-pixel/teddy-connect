"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function HomeNav() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
  }, []);

  if (loggedIn) {
    return (
      <Link href="/dashboard" className="btn-primary">
        Go to Dashboard
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="px-4 py-2 text-green-600 dark:text-indigo-400 font-medium hover:text-green-700 dark:hover:text-indigo-300">
        Log In
      </Link>
      <Link href="/register" className="btn-primary">
        Sign Up
      </Link>
    </>
  );
}
