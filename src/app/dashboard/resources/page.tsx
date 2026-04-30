"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import AppNav from "@/components/AppNav";
import PageTransition from "@/components/PageTransition";

export default function ResourcesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🧸</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const parentName = user?.user_metadata?.parent_name || user?.email?.split("@")[0] || "Parent";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNav parentName={parentName} onLogout={handleLogout} />
      <PageTransition className="max-w-6xl mx-auto px-6 py-8 page-enter">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Resources</h1>
          <p className="text-gray-600 dark:text-gray-400">Helpful guides and activities for your family</p>
        </div>
        <div className="card text-center py-20">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Coming Soon</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Tips, guides, and activities to support children with communication challenges — curated by our community.
          </p>
        </div>
      </PageTransition>
    </div>
  );
}
