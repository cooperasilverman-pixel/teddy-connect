"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import AppNav from "@/components/AppNav";

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

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [myChildren, setMyChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [myChild, setMyChild] = useState<Child | null>(null);
  const [matches, setMatches] = useState<MatchedChild[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const resolvedChildId = childId ?? selectedChildId;

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      if (!childId) {
        const { data } = await supabase.from("children").select("*").eq("user_id", user.id);
        setMyChildren(data ?? []);
      }
      setLoading(false);
    };
    init();
  }, [router, childId]);

  const loadMatchData = useCallback(async (activeChildId: string, userId: string) => {
    const { data: selected } = await supabase
      .from("children")
      .select("*")
      .eq("id", activeChildId)
      .eq("user_id", userId)
      .single();

    if (!selected) return;
    setMyChild(selected);

    const { data: others } = await supabase
      .from("children")
      .select("*")
      .neq("user_id", userId);

    const { data: friendships } = await supabase
      .from("friendships")
      .select("child_id_1, child_id_2")
      .or(`child_id_1.eq.${activeChildId},child_id_2.eq.${activeChildId}`);

    const excludedIds = new Set<string>();
    (friendships ?? []).forEach((f) => {
      excludedIds.add(f.child_id_1 === activeChildId ? f.child_id_2 : f.child_id_1);
    });

    setMatches(computeMatches(selected, others ?? [], excludedIds));
  }, []);

  useEffect(() => {
    if (user && resolvedChildId) {
      loadMatchData(resolvedChildId, user.id);
    }
  }, [user, resolvedChildId, loadMatchData]);

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

  const parentName = user?.user_metadata?.parent_name || user?.email?.split("@")[0] || "Parent";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return null;

  if (!resolvedChildId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AppNav parentName={parentName} onLogout={handleLogout} />
        <main className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Find Friends</h1>
          <p className="text-gray-500 mb-8">Who is looking for friends today?</p>
          {myChildren.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">👶</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No children yet</h2>
              <p className="text-gray-500 mb-6">Add a child profile on the dashboard first.</p>
              <Link href="/dashboard" className="btn-primary py-3 px-6">Go to Dashboard</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {myChildren.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="text-5xl mb-3">{child.avatar}</div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">{child.display_name}</h3>
                  <p className="text-sm text-gray-500">{child.age} years old</p>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!myChild) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AppNav parentName={parentName} onLogout={handleLogout} />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="text-4xl mb-4">🧸</div>
            <p className="text-gray-600">Finding friends...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm">
      <AppNav parentName={parentName} onLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{myChild.avatar}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Friends for {myChild.display_name}
              </h1>
              <p className="text-sm text-gray-500">Matches ranked by shared interests and communication style</p>
            </div>
          </div>
          {!childId && (
            <button
              onClick={() => { setSelectedChildId(null); setMyChild(null); setMatches([]); }}
              className="ml-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Switch child
            </button>
          )}
        </div>

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
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-4xl flex-shrink-0">
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
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
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
                        <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full">
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
