"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import AddChildModal from "@/components/AddChildModal";

interface Child {
  id: string;
  display_name: string;
  avatar: string;
  age: number;
  interests: string[];
  communication_style: string | null;
  bio: string | null;
}

interface FriendRequest {
  id: string;
  child_id_1: string;
  child_id_2: string;
  requested_by: string;
  status: string;
  requester: Child;
  recipient: Child;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("children")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) setChildren(data);
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get IDs of this parent's children
    const { data: myKids } = await supabase
      .from("children")
      .select("id")
      .eq("user_id", user.id);

    if (!myKids || myKids.length === 0) return;

    const myKidIds = myKids.map((k) => k.id);

    // Get pending requests where one of my kids is the recipient (child_id_2)
    const { data: requests } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "pending")
      .in("child_id_2", myKidIds);

    if (!requests || requests.length === 0) {
      setPendingRequests([]);
      return;
    }

    // Fetch the requester and recipient child details
    const allChildIds = [
      ...new Set(requests.flatMap((r) => [r.child_id_1, r.child_id_2])),
    ];
    const { data: childDetails } = await supabase
      .from("children")
      .select("*")
      .in("id", allChildIds);

    const childMap = Object.fromEntries((childDetails ?? []).map((c) => [c.id, c]));

    const enriched: FriendRequest[] = requests.map((r) => ({
      ...r,
      requester: childMap[r.child_id_1],
      recipient: childMap[r.child_id_2],
    }));

    setPendingRequests(enriched);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchChildren();
      fetchPendingRequests();
    }
  }, [user, fetchChildren, fetchPendingRequests]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const respondToRequest = async (requestId: string, status: "approved" | "declined") => {
    setRespondingId(requestId);
    await supabase
      .from("friendships")
      .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
      .eq("id", requestId);
    await fetchPendingRequests();
    setRespondingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🧸</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const parentName = user?.user_metadata?.parent_name || user?.email?.split("@")[0] || "Parent";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🧸</span>
            <span className="text-xl font-bold text-orange-600">Teddy Connect</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Hi, {parentName}</span>
            <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">Log out</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Family Dashboard</h1>
          <p className="text-gray-600">Manage your children&apos;s profiles and connections</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card bg-orange-50 border border-orange-100">
            <div className="text-3xl mb-2">👧</div>
            <div className="text-2xl font-bold text-gray-800">{children.length}</div>
            <div className="text-gray-600">Children</div>
          </div>
          <div className="card bg-green-50 border border-green-100">
            <div className="text-3xl mb-2">🤝</div>
            <div className="text-2xl font-bold text-gray-800">0</div>
            <div className="text-gray-600">Total Friends</div>
          </div>
          <div className="card bg-blue-50 border border-blue-100">
            <div className="text-3xl mb-2">✉️</div>
            <div className="text-2xl font-bold text-gray-800">{pendingRequests.length}</div>
            <div className="text-gray-600">Pending Requests</div>
          </div>
        </div>

        {/* Pending Friend Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Friend Requests</h2>
            <div className="card divide-y divide-gray-100">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                      {req.requester?.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        <span className="text-blue-600">{req.requester?.display_name}</span>
                        {" wants to be friends with "}
                        <span className="text-green-600">{req.recipient?.display_name}</span>
                      </p>
                      {req.requester?.interests?.length > 0 && (
                        <p className="text-sm text-gray-500">
                          Interests: {req.requester.interests.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => respondToRequest(req.id, "approved")}
                      disabled={respondingId === req.id}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => respondToRequest(req.id, "declined")}
                      disabled={respondingId === req.id}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Children Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Your Children</h2>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">+ Add Child</button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div key={child.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-4xl">
                    {child.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{child.display_name}</h3>
                    <p className="text-gray-500">{child.age} years old</p>
                  </div>
                </div>

                {child.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {child.interests.map((interest) => (
                      <span key={interest} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}

                {child.communication_style && (
                  <p className="text-sm text-gray-500 mb-4">{child.communication_style}</p>
                )}

                {child.bio && (
                  <p className="text-sm text-gray-600 italic mb-4">&quot;{child.bio}&quot;</p>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-4 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition-colors">
                    View Profile
                  </button>
                  <Link href={`/dashboard/find-friends?childId=${child.id}`} className="flex-1 py-2 px-4 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors text-center">
                    Find Friends
                  </Link>
                </div>
              </div>
            ))}

            {/* Add Child Card */}
            <div
              onClick={() => setShowAddModal(true)}
              className="card border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[200px] hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">➕</div>
                <p className="text-gray-600 font-medium">Add a Child</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state when no children */}
        {children.length === 0 && (
          <div className="card text-center py-12 mb-8">
            <div className="text-5xl mb-4">🧸</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No children added yet</h3>
            <p className="text-gray-600 mb-6">Add your child&apos;s profile to start finding friends!</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary px-8 py-3">
              + Add Your First Child
            </button>
          </div>
        )}
      </main>

      <AddChildModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onChildAdded={fetchChildren}
      />
    </div>
  );
}
