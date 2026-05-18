"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import AppNav from "@/components/AppNav";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: "tip" | "link";
  icon: string;
  body: string | null;
  org_name: string | null;
  url: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
}

export default function ResourcesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"tip" | "link">("tip");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setResourcesLoading(true);
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setResources(data);
    setResourcesLoading(false);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (user) fetchResources();
  }, [user, fetchResources]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleCategoryChange = (cat: "tip" | "link") => {
    setActiveCategory(cat);
    setActiveTag(null);
    setSearchQuery("");
    setExpandedId(null);
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
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  const filtered = resources.filter((r) => {
    if (r.category !== activeCategory) return false;
    if (activeTag && !r.tags.includes(activeTag)) return false;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.org_name ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allTags = Array.from(
    new Set(
      resources
        .filter((r) => r.category === activeCategory)
        .flatMap((r) => r.tags)
    )
  ).sort();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNav parentName={parentName} onLogout={handleLogout} avatarUrl={avatarUrl} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Resources</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tips, guides, and organizations to support your family
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6">
          {(["tip", "link"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                activeCategory === cat
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {cat === "tip" ? "💡 Communication Tips" : "🔗 External Links"}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeCategory === "tip" ? "Search tips..." : "Search organizations..."
            }
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
          />
        </div>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTag(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                activeTag === null
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  activeTag === tag
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {resourcesLoading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-bounce">📚</div>
              <p className="text-gray-500 dark:text-gray-400">Loading resources...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">
              {searchQuery || activeTag ? "🔍" : "📭"}
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {searchQuery || activeTag ? "No matches found" : "No resources yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {searchQuery || activeTag
                ? "Try clearing your search or tag filter."
                : "Check back soon — we're adding resources regularly."}
            </p>
            {(searchQuery || activeTag) && (
              <button
                onClick={() => { setSearchQuery(""); setActiveTag(null); }}
                className="mt-4 text-sm text-green-600 dark:text-green-400 font-medium hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map((r) =>
              r.category === "tip" ? (
                <div key={r.id} className="card border-l-4 border-green-400">
                  <button
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl flex-shrink-0 mt-0.5">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1">
                          {r.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{r.description}</p>
                        {r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {r.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {r.body && (
                        <span className="text-gray-400 text-sm flex-shrink-0 mt-1">
                          {expandedId === r.id ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </button>
                  {expandedId === r.id && r.body && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {r.body}
                    </div>
                  )}
                </div>
              ) : (
                <div key={r.id} className="card border-l-4 border-blue-400 flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl flex-shrink-0 mt-0.5">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1">
                        {r.title}
                      </h3>
                      {r.org_name && (
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                          {r.org_name}
                        </p>
                      )}
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{r.description}</p>
                      {r.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {r.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start px-5 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      Visit Site →
                    </a>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
