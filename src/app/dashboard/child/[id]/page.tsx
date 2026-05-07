"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";
import EditChildModal from "@/components/EditChildModal";

interface Child {
  id: string;
  display_name: string;
  avatar: string;
  age: number;
  interests: string[];
  communication_style: string | null;
  bio: string | null;
}

const INTEREST_EMOJIS: Record<string, string> = {
  Games: "🎮", Art: "🎨", Animals: "🐾", Music: "🎵",
  Space: "🚀", Dinosaurs: "🦕", Sports: "⚽", Reading: "📚",
  Cooking: "🍳", Science: "🔬", Nature: "🌿", Movies: "🎬",
};

export default function ChildProfilePage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [parentName, setParentName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchChild = async (userId: string) => {
    const { data } = await supabase
      .from("children")
      .select("*")
      .eq("id", childId)
      .eq("user_id", userId)
      .single();

    if (!data) {
      setNotFound(true);
    } else {
      setChild(data);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setParentName(user.user_metadata?.parent_name ?? "");
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);

      await fetchChild(user.id);

      const { count } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .or(`child_id_1.eq.${childId},child_id_2.eq.${childId}`)
        .eq("status", "approved");

      setFriendCount(count ?? 0);
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🧸</div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (notFound || !child) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Profile not found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This child profile doesn&apos;t exist or belongs to another account.</p>
          <Link href="/dashboard" className="btn-primary px-8 py-3">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNav parentName={parentName} onLogout={handleLogout} avatarUrl={avatarUrl} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors mb-6"
        >
          ← Back to Dashboard
        </Link>

        {/* Profile hero card */}
        <div className="card mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-5xl flex-shrink-0">
              {child.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">{child.display_name}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">{child.age} years old</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
                  👫 {friendCount} {friendCount === 1 ? "friend" : "friends"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors flex-shrink-0"
            >
              Edit
            </button>
          </div>

          {child.bio && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-300 italic text-lg leading-relaxed">
                &quot;{child.bio}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Interests */}
        {child.interests.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Interests</h2>
            <div className="flex flex-wrap gap-3">
              {child.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-4 py-2 rounded-full font-medium text-sm"
                >
                  {INTEREST_EMOJIS[interest] ?? "⭐"} {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Communication style */}
        {child.communication_style && (
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Communication Style</h2>
            <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl px-4 py-3">
              <span className="text-2xl">💬</span>
              <p className="text-purple-700 dark:text-purple-300 font-medium">{child.communication_style}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/dashboard/find-friends?childId=${child.id}`}
            className="flex-1 text-center py-3 px-6 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-semibold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            Find Friends
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 text-center py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>

      {showEditModal && (
        <EditChildModal
          isOpen={true}
          onClose={() => setShowEditModal(false)}
          onChildUpdated={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await fetchChild(user.id);
          }}
          child={child}
        />
      )}
    </div>
  );
}
