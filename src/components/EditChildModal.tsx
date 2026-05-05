"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AVATARS = [
  "🦁", "🐼", "🦊", "🐸", "🦋", "🐰", "🐶", "🐱",
  "🦄", "🐧", "🦖", "🐬", "🦉", "🐝", "🐢", "🦜",
];

const INTERESTS = [
  { label: "Games", emoji: "🎮" },
  { label: "Art", emoji: "🎨" },
  { label: "Animals", emoji: "🐾" },
  { label: "Music", emoji: "🎵" },
  { label: "Space", emoji: "🚀" },
  { label: "Dinosaurs", emoji: "🦕" },
  { label: "Sports", emoji: "⚽" },
  { label: "Reading", emoji: "📚" },
  { label: "Cooking", emoji: "🍳" },
  { label: "Science", emoji: "🔬" },
  { label: "Nature", emoji: "🌿" },
  { label: "Movies", emoji: "🎬" },
];

const COMMUNICATION_STYLES = [
  { label: "Loves to chat", emoji: "💬", description: "Enjoys talking and sharing ideas" },
  { label: "Takes time to warm up", emoji: "🌱", description: "Needs a bit of time before opening up" },
  { label: "Prefers pictures/emojis", emoji: "🎨", description: "Expresses best through visuals" },
  { label: "Likes structured activities", emoji: "🧩", description: "Thrives with guided interactions" },
];

interface Child {
  id: string;
  display_name: string;
  avatar: string;
  age: number;
  interests: string[];
  communication_style: string | null;
  bio: string | null;
}

interface EditChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChildUpdated: () => void;
  child: Child;
}

export default function EditChildModal({ isOpen, onClose, onChildUpdated, child }: EditChildModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState<number | "">(child.age);
  const [avatar, setAvatar] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDisplayName(child.display_name);
      setAge(child.age);
      setAvatar(child.avatar);
      setInterests(child.interests);
      setCommunicationStyle(child.communication_style ?? "");
      setBio(child.bio ?? "");
      setStep(1);
      setShowDeleteConfirm(false);
      setError(null);
    }
  }, [isOpen, child.id]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const canAdvance = () => {
    if (step === 1) return displayName.trim() !== "" && age !== "";
    if (step === 2) return avatar !== "";
    if (step === 3) return interests.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("children")
        .update({
          display_name: displayName.trim(),
          age: Number(age),
          avatar,
          interests,
          communication_style: communicationStyle || null,
          bio: bio.trim() || null,
        })
        .eq("id", child.id);
      if (updateError) { setError(updateError.message); return; }
      onClose();
      onChildUpdated();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase.from("children").delete().eq("id", child.id);
      if (deleteError) { setError(deleteError.message); return; }
      onClose();
      onChildUpdated();
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Edit {child.display_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Step indicators */}
        {!showDeleteConfirm && (
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* Delete confirmation */}
        {showDeleteConfirm ? (
          <div className="text-center py-4">
            <div className="text-6xl mb-4">{child.avatar}</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Delete {child.display_name}?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              This will permanently remove {child.display_name}&apos;s profile and all their connections.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 text-gray-600 dark:text-gray-300 font-medium hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Name & Age */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                    placeholder="A fun nickname for your child"
                    maxLength={30}
                  />
                  <p className="text-xs text-gray-400 mt-1">This is what other kids will see (not their real name)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age</label>
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="">Select age</option>
                    {Array.from({ length: 9 }, (_, i) => i + 5).map((a) => (
                      <option key={a} value={a}>{a} years old</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete this profile
                </button>
              </div>
            )}

            {/* Step 2: Avatar */}
            {step === 2 && (
              <div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Pick an avatar for your child</p>
                <div className="grid grid-cols-4 gap-3">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAvatar(a)}
                      className={`text-4xl p-3 rounded-2xl transition-all ${
                        avatar === a
                          ? "bg-green-100 ring-2 ring-green-400 scale-110"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">What does your child enjoy? (pick at least 1)</p>
                <div className="grid grid-cols-3 gap-3">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest.label}
                      onClick={() => toggleInterest(interest.label)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl text-sm font-medium transition-all ${
                        interests.includes(interest.label)
                          ? "bg-green-100 ring-2 ring-green-400"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      <span className="text-2xl">{interest.emoji}</span>
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Communication Style & Bio */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Communication Style</label>
                  <div className="grid grid-cols-1 gap-3">
                    {COMMUNICATION_STYLES.map((style) => (
                      <button
                        key={style.label}
                        onClick={() => setCommunicationStyle(style.label)}
                        className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                          communicationStyle === style.label
                            ? "bg-green-100 ring-2 ring-green-400"
                            : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        <span className="text-2xl">{style.emoji}</span>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">{style.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{style.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Short Bio (optional)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none"
                    placeholder="E.g. I love building with Legos and watching nature shows!"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-400 mt-1">{bio.length}/200</p>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 text-gray-600 dark:text-gray-300 font-medium hover:text-gray-800 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canAdvance()}
                  className="btn-primary px-8 py-3 disabled:opacity-40"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary px-8 py-3 disabled:opacity-40"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
