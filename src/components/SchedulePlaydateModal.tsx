"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Child {
  id: string;
  display_name: string;
  avatar: string;
  age: number;
}

interface ApprovedFriendship {
  id: string;
  myChildId: string;
  friendChild: Child;
}

interface SchedulePlaydateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaydateScheduled: () => void;
  preselectedChildId: string | null;
  myChildren: Child[];
  approvedFriendships: ApprovedFriendship[];
}

export default function SchedulePlaydateModal({
  isOpen,
  onClose,
  onPlaydateScheduled,
  preselectedChildId,
  myChildren,
  approvedFriendships,
}: SchedulePlaydateModalProps) {
  const [selectedMyChildId, setSelectedMyChildId] = useState<string>("");
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedMyChildId(preselectedChildId ?? (myChildren[0]?.id ?? ""));
      setSelectedFriendId("");
      setScheduledDate("");
      setScheduledTime("");
      setLocation("");
      setNotes("");
      setError(null);
    }
  }, [isOpen, preselectedChildId, myChildren]);

  // Reset friend selection when the child changes
  useEffect(() => {
    setSelectedFriendId("");
  }, [selectedMyChildId]);

  const friendsForSelectedChild = approvedFriendships.filter(
    (f) => f.myChildId === selectedMyChildId
  );

  const canSubmit =
    selectedMyChildId !== "" &&
    selectedFriendId !== "" &&
    scheduledDate !== "" &&
    scheduledTime !== "" &&
    !isSubmitting;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("playdates").insert({
        proposer_child_id: selectedMyChildId,
        invitee_child_id: selectedFriendId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        location: location.trim() || null,
        notes: notes.trim() || null,
        status: "pending",
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      onPlaydateScheduled();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Schedule a Playdate</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* My child */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your child</label>
            <select
              value={selectedMyChildId}
              onChange={(e) => setSelectedMyChildId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
            >
              {myChildren.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.avatar} {c.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Friend to invite */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invite a friend</label>
            {friendsForSelectedChild.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                {selectedMyChildId
                  ? "This child has no approved friends yet. Find friends first!"
                  : "Select a child above."}
              </p>
            ) : (
              <select
                value={selectedFriendId}
                onChange={(e) => setSelectedFriendId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              >
                <option value="">Select a friend…</option>
                {friendsForSelectedChild.map((f) => (
                  <option key={f.id} value={f.friendChild.id}>
                    {f.friendChild.avatar} {f.friendChild.display_name} (age {f.friendChild.age})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
            <input
              type="date"
              value={scheduledDate}
              min={todayStr}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
            />
          </div>

          {/* Location (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
              placeholder="e.g. Riverside Park, our house…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Anything the other family should know…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{notes.length}/300</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary px-8 py-3 disabled:opacity-40"
          >
            {isSubmitting ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
