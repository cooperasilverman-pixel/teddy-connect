"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Child {
  id: string;
  display_name: string;
  avatar: string;
  age: number;
  interests: string[];
  communication_style: string | null;
  bio: string | null;
}

interface MatchedChild extends Child {
  sharedInterests: string[];
  score: number;
  requestSent: boolean;
}

function computeMatches(myChild: Child, others: Child[], excludedIds: Set<string>): MatchedChild[] {
  return others
    .filter((c) => !excludedIds.has(c.id))
    .map((c) => {
      const sharedInterests = myChild.interests.filter((i) => c.interests.includes(i));
      const styleBonus = myChild.communication_style === c.communication_style ? 1 : 0;
      const score = sharedInterests.length + styleBonus;
      return { ...c, sharedInterests, score, requestSent: false };
    })
    .sort((a, b) => b.score - a.score);
}

function FindFriendsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId");

  const [loading, setLoading] = useState(true);
  const [myChild, setMyChild] = useState<Child | null>(null);
  const [matches, setMatches] = useState<MatchedChild[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    if (!childId) { router.push("/dashboard"); return; }

    // Fetch the selected child
    const { data: selected } = await supabase
      .from("children")
      .select("*")
      .eq("id", childId)
      .eq("user_id", user.id)
      .single();

    if (!selected) { router.push("/dashboard"); return; }
    setMyChild(selected);

    // Fetch all children from other families
    const { data: others } = await supabase
      .from("children")
      .select("*")
      .neq("user_id", user.id);

    // Fetch existing friendships involving this child
    const { data: friendships } = await supabase
      .from("friendships")
      .select("child_id_1, child_id_2")
      .or(`child_id_1.eq.${childId},child_id_2.eq.${childId}`);

    const excludedIds = new Set<string>();
    (friendships ?? []).forEach((f) => {
      excludedIds.add(f.child_id_1 === childId ? f.child_id_2 : f.child_id_1);
    });

    setMatches(computeMatches(selected, others ?? [], excludedIds));
    setLoading(false);
  }, [childId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const sendRequest = async (match: MatchedChild) => {
    if (!myChild) return;
    setSendingId(match.id);
    setSendError(null);

    const { error } = await supabase.from("friendships").insert({
      child_id_1: myChild.id,
      child_id_2: match.id,
      requested_by: myChild.id,
      status: "pending",
    });

    if (error) {
      setSendError("Couldn't send request: " + error.message);
    } else {
      setMatches((prev) => prev.map((m) => m.id === match.id ? { ...m, requestSent: true } : m));
    }
    setSendingId(null);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen gradient-warm">
      {/* Nav */}
      <nav className="bg-white shadow-sm">
        <div className="flex items-center gap-4 px-6 py-4 max-w-5xl mx-auto">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
            ← Back
          </Link>
          {myChild && (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{myChild.avatar}</span>
              <div>
                <p className="font-bold text-gray-800">Finding friends for {myChild.display_name}</p>
                <p className="text-xs text-gray-500">{myChild.age} years old</p>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Friend Suggestions</h1>
        <p className="text-gray-500 mb-8">Matches are ranked by shared interests and communication style.</p>

        {sendError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
            {sendError}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No matches found yet</h2>
            <p className="text-gray-500">More families are joining every day — check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {matches.map((match) => {
              const maxScore = Math.max(myChild?.interests.length ?? 1, 1);
              const otherInterests = match.interests.filter((i) => !match.sharedInterests.includes(i));

              return (
                <div key={match.id} className="card flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-4xl flex-shrink-0">
                      {match.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800">{match.display_name}</h3>
                      <p className="text-sm text-gray-500">{match.age} years old</p>
                    </div>
                    {/* Score badge */}
                    <div className={`text-center px-3 py-2 rounded-xl flex-shrink-0 ${
                      match.sharedInterests.length >= 3
                        ? "bg-green-100 text-green-700"
                        : match.sharedInterests.length >= 1
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      <p className="text-xl font-bold">{match.sharedInterests.length}/{maxScore}</p>
                      <p className="text-xs">interests</p>
                    </div>
                  </div>

                  {/* Interests */}
                  {match.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {match.sharedInterests.map((i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                          ✓ {i}
                        </span>
                      ))}
                      {otherInterests.map((i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                          {i}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Communication style */}
                  {match.communication_style && (
                    <p className="text-sm text-gray-500">
                      {match.communication_style === myChild?.communication_style ? "✨ " : ""}
                      {match.communication_style}
                    </p>
                  )}

                  {/* Bio */}
                  {match.bio && (
                    <p className="text-sm text-gray-600 italic">&quot;{match.bio}&quot;</p>
                  )}

                  {/* Action */}
                  {match.requestSent ? (
                    <div className="mt-auto text-center py-3 px-4 bg-green-50 text-green-700 rounded-xl font-medium text-sm">
                      ✓ Friend request sent!
                    </div>
                  ) : (
                    <button
                      onClick={() => sendRequest(match)}
                      disabled={sendingId === match.id}
                      className="mt-auto btn-primary py-3 text-sm disabled:opacity-50"
                    >
                      {sendingId === match.id ? "Sending..." : "Send Friend Request"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function FindFriends() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🧸</div>
          <p className="text-gray-600">Finding friends...</p>
        </div>
      </div>
    }>
      <FindFriendsInner />
    </Suspense>
  );
}
