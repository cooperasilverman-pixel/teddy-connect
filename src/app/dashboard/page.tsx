"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import AddChildModal from "@/components/AddChildModal";
import SchedulePlaydateModal from "@/components/SchedulePlaydateModal";
import AppNav from "@/components/AppNav";
import PageTransition from "@/components/PageTransition";

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

interface ApprovedFriendship {
  id: string;
  myChildId: string;
  friendChild: Child;
}

interface Playdate {
  id: string;
  proposer_child_id: string;
  invitee_child_id: string;
  scheduled_date: string;
  scheduled_time: string;
  location: string | null;
  notes: string | null;
  status: "pending" | "confirmed" | "declined" | "cancelled";
  proposerChild: Child;
  inviteeChild: Child;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function googleCalendarUrl(playdate: Playdate): string {
  const [year, month, day] = playdate.scheduled_date.split("-").map(Number);
  const [hour, minute] = playdate.scheduled_time.split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dt = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  const dtEnd = `${year}${pad(month)}${pad(hour + 1)}${pad(minute)}00`;
  const name1 = playdate.proposerChild?.display_name ?? "";
  const name2 = playdate.inviteeChild?.display_name ?? "";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Playdate: ${name1} & ${name2}`,
    dates: `${dt}/${dtEnd}`,
    details: "Arranged through Teddy Connect",
    location: playdate.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadICS(playdate: Playdate) {
  const [year, month, day] = playdate.scheduled_date.split("-").map(Number);
  const [hour, minute] = playdate.scheduled_time.split(":").map(Number);

  const pad = (n: number) => String(n).padStart(2, "0");
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  const endHour = hour + 1;
  const dtEnd = `${year}${pad(month)}${pad(day)}T${pad(endHour)}${pad(minute)}00`;

  const name1 = playdate.proposerChild?.display_name ?? "";
  const name2 = playdate.inviteeChild?.display_name ?? "";
  const summary = `Playdate: ${name1} & ${name2}`;
  const location = playdate.location ?? "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TeddyConnect//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    location ? `LOCATION:${location}` : "",
    "DESCRIPTION:Arranged through Teddy Connect",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `playdate-${name1}-${name2}.ics`.replace(/\s+/g, "-").toLowerCase();
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [approvedFriendships, setApprovedFriendships] = useState<ApprovedFriendship[]>([]);
  const [playdates, setPlaydates] = useState<Playdate[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlaydateModal, setShowPlaydateModal] = useState(false);
  const [playdatePreselectedChildId, setPlaydatePreselectedChildId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondingPlaydateId, setRespondingPlaydateId] = useState<string | null>(null);
  const [calendarDropdownId, setCalendarDropdownId] = useState<string | null>(null);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarDropdownRef.current && !calendarDropdownRef.current.contains(e.target as Node)) {
        setCalendarDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    const { data: myKids } = await supabase
      .from("children")
      .select("id")
      .eq("user_id", user.id);

    if (!myKids || myKids.length === 0) return;

    const myKidIds = myKids.map((k) => k.id);

    const { data: requests } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "pending")
      .in("child_id_2", myKidIds);

    if (!requests || requests.length === 0) {
      setPendingRequests([]);
      return;
    }

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

  const fetchApprovedFriendships = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: myKids } = await supabase
      .from("children")
      .select("id")
      .eq("user_id", user.id);

    if (!myKids?.length) { setApprovedFriendships([]); return; }
    const myKidIds = myKids.map((k) => k.id);

    const { data: friendships } = await supabase
      .from("friendships")
      .select("id, child_id_1, child_id_2")
      .eq("status", "approved")
      .or(`child_id_1.in.(${myKidIds.join(",")}),child_id_2.in.(${myKidIds.join(",")})`);

    if (!friendships?.length) { setApprovedFriendships([]); return; }

    const friendChildIds = friendships.map((f) =>
      myKidIds.includes(f.child_id_1) ? f.child_id_2 : f.child_id_1
    );
    const { data: friendChildren } = await supabase
      .from("children")
      .select("*")
      .in("id", [...new Set(friendChildIds)]);

    const childMap = Object.fromEntries((friendChildren ?? []).map((c) => [c.id, c]));

    const enriched: ApprovedFriendship[] = friendships.map((f) => {
      const myChildId = myKidIds.includes(f.child_id_1) ? f.child_id_1 : f.child_id_2;
      const friendChildId = myChildId === f.child_id_1 ? f.child_id_2 : f.child_id_1;
      return { id: f.id, myChildId, friendChild: childMap[friendChildId] };
    });
    setApprovedFriendships(enriched);
  }, []);

  const fetchPlaydates = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: myKids } = await supabase
      .from("children")
      .select("id")
      .eq("user_id", user.id);

    if (!myKids?.length) { setPlaydates([]); return; }
    const myKidIds = myKids.map((k) => k.id);

    const { data: rows } = await supabase
      .from("playdates")
      .select("*")
      .in("status", ["pending", "confirmed"])
      .or(`proposer_child_id.in.(${myKidIds.join(",")}),invitee_child_id.in.(${myKidIds.join(",")})`)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (!rows?.length) { setPlaydates([]); return; }

    const allChildIds = [...new Set(rows.flatMap((r) => [r.proposer_child_id, r.invitee_child_id]))];
    const { data: childDetails } = await supabase
      .from("children")
      .select("*")
      .in("id", allChildIds);

    const childMap = Object.fromEntries((childDetails ?? []).map((c) => [c.id, c]));

    setPlaydates(
      rows.map((r) => ({
        ...r,
        proposerChild: childMap[r.proposer_child_id],
        inviteeChild: childMap[r.invitee_child_id],
      }))
    );
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
      fetchApprovedFriendships();
      fetchPlaydates();
    }
  }, [user, fetchChildren, fetchPendingRequests, fetchApprovedFriendships, fetchPlaydates]);

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
    await fetchApprovedFriendships();
    setRespondingId(null);
  };

  const respondToPlaydate = async (
    playdateId: string,
    status: "confirmed" | "declined" | "cancelled"
  ) => {
    setRespondingPlaydateId(playdateId);
    await supabase.from("playdates").update({ status }).eq("id", playdateId);
    await fetchPlaydates();
    setRespondingPlaydateId(null);
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
  const myChildIds = new Set(children.map((c) => c.id));

  const pendingReceivedPlaydates = playdates.filter(
    (p) => p.status === "pending" && myChildIds.has(p.invitee_child_id)
  );
  const pendingSentPlaydates = playdates.filter(
    (p) => p.status === "pending" && myChildIds.has(p.proposer_child_id)
  );
  const upcomingConfirmedPlaydates = playdates.filter((p) => p.status === "confirmed");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNav parentName={parentName} onLogout={handleLogout} />

      {/* Main Content */}
      <PageTransition className="max-w-6xl mx-auto px-6 py-8 page-enter">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Family Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your children&apos;s profiles and connections</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
            <div className="text-3xl mb-2">👧</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{children.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Children</div>
          </div>
          <div className="card bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
            <div className="text-3xl mb-2">🤝</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{approvedFriendships.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Total Friends</div>
          </div>
          <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
            <div className="text-3xl mb-2">✉️</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{pendingRequests.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Pending Requests</div>
          </div>
        </div>

        {/* Pending Friend Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Pending Friend Requests</h2>
            <div className="card divide-y divide-gray-100">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                      {req.requester?.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        <span className="text-blue-600">{req.requester?.display_name}</span>
                        {" wants to be friends with "}
                        <span className="text-green-600">{req.recipient?.display_name}</span>
                      </p>
                      {req.requester?.interests?.length > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Interests: {req.requester.interests.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => respondToRequest(req.id, "approved")}
                      disabled={respondingId === req.id}
                      className="btn-green px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
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

        {/* Playdates Section */}
        {(pendingReceivedPlaydates.length > 0 ||
          pendingSentPlaydates.length > 0 ||
          upcomingConfirmedPlaydates.length > 0) && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Playdates</h2>

            {/* Received invites */}
            {pendingReceivedPlaydates.length > 0 && (
              <div className="card mb-4 divide-y divide-gray-100">
                <p className="text-sm font-semibold text-purple-700 mb-3">Playdate Invites</p>
                {pendingReceivedPlaydates.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-4 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                        {p.proposerChild?.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          <span className="text-purple-600">{p.proposerChild?.display_name}</span>
                          {" wants a playdate with "}
                          <span className="text-green-600">{p.inviteeChild?.display_name}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(p.scheduled_date)} at {formatTime(p.scheduled_time)}
                          {p.location ? ` · ${p.location}` : ""}
                        </p>
                        {p.notes && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic">&quot;{p.notes}&quot;</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => respondToPlaydate(p.id, "confirmed")}
                        disabled={respondingPlaydateId === p.id}
                        className="btn-green px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => respondToPlaydate(p.id, "declined")}
                        disabled={respondingPlaydateId === p.id}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming confirmed playdates */}
            {upcomingConfirmedPlaydates.length > 0 && (
              <div className="card mb-4 divide-y divide-gray-100">
                <p className="text-sm font-semibold text-green-700 mb-3">Upcoming Playdates</p>
                {upcomingConfirmedPlaydates.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-4 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                        📅
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          <span className="text-green-600">{p.proposerChild?.display_name}</span>
                          {" & "}
                          <span className="text-green-600">{p.inviteeChild?.display_name}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(p.scheduled_date)} at {formatTime(p.scheduled_time)}
                          {p.location ? ` · ${p.location}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 items-center">
                      <div className="relative" ref={calendarDropdownId === p.id ? calendarDropdownRef : undefined}>
                        <button
                          onClick={() => setCalendarDropdownId(calendarDropdownId === p.id ? null : p.id)}
                          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          📅 Add to Calendar ▾
                        </button>
                        {calendarDropdownId === p.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 overflow-hidden">
                            <a
                              href={googleCalendarUrl(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setCalendarDropdownId(null)}
                              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <span>🗓</span> Google Calendar
                            </a>
                            <button
                              onClick={() => { downloadICS(p); setCalendarDropdownId(null); }}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <span>🍎</span> Apple Calendar
                            </button>
                          </div>
                        )}
                      </div>
                      {myChildIds.has(p.proposer_child_id) && (
                        <button
                          onClick={() => respondToPlaydate(p.id, "cancelled")}
                          disabled={respondingPlaydateId === p.id}
                          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sent / awaiting response */}
            {pendingSentPlaydates.length > 0 && (
              <div className="card divide-y divide-gray-100">
                <p className="text-sm font-semibold text-gray-500 mb-3">Sent Invites</p>
                {pendingSentPlaydates.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-4 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                        {p.inviteeChild?.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          Waiting for {p.inviteeChild?.display_name}&apos;s family to respond
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(p.scheduled_date)} at {formatTime(p.scheduled_time)}
                          {p.location ? ` · ${p.location}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => respondToPlaydate(p.id, "cancelled")}
                      disabled={respondingPlaydateId === p.id}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Children Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Your Children</h2>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">+ Add Child</button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div key={child.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-4xl">
                    {child.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{child.display_name}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{child.age} years old</p>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{child.communication_style}</p>
                )}

                {child.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-4">&quot;{child.bio}&quot;</p>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button className="flex-1 py-2 px-4 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors">
                    View Profile
                  </button>
                  <Link
                    href={`/dashboard/find-friends?childId=${child.id}`}
                    className="flex-1 py-2 px-4 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors text-center"
                  >
                    Find Friends
                  </Link>
                  <button
                    onClick={() => {
                      setPlaydatePreselectedChildId(child.id);
                      setShowPlaydateModal(true);
                    }}
                    disabled={!approvedFriendships.some((f) => f.myChildId === child.id)}
                    className={`flex-1 py-2 px-4 bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors ${
                      approvedFriendships.some((f) => f.myChildId === child.id)
                        ? "hover:bg-purple-200"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                  >
                    Playdate
                  </button>
                </div>
              </div>
            ))}

            {/* Add Child Card */}
            <div
              onClick={() => setShowAddModal(true)}
              className="card border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[200px] hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors cursor-pointer"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">➕</div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Add a Child</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state when no children */}
        {children.length === 0 && (
          <div className="card text-center py-12 mb-8">
            <div className="text-5xl mb-4">🧸</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No children added yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Add your child&apos;s profile to start finding friends!</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary px-8 py-3">
              + Add Your First Child
            </button>
          </div>
        )}
      </PageTransition>

      <AddChildModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onChildAdded={fetchChildren}
      />

      <SchedulePlaydateModal
        isOpen={showPlaydateModal}
        onClose={() => {
          setShowPlaydateModal(false);
          setPlaydatePreselectedChildId(null);
        }}
        onPlaydateScheduled={fetchPlaydates}
        preselectedChildId={playdatePreselectedChildId}
        myChildren={children}
        approvedFriendships={approvedFriendships}
      />
    </div>
  );
}
