"use client";

import { useState } from "react";
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

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChildAdded: () => void;
}

export default function AddChildModal({ isOpen, onClose, onChildAdded }: AddChildModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [avatar, setAvatar] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [bio, setBio] = useState("");

  const resetForm = () => {
    setStep(1);
    setDisplayName("");
    setAge("");
    setAvatar("");
    setInterests([]);
    setCommunicationStyle("");
    setBio("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in.");
        return;
      }

      const { error: insertError } = await supabase.from("children").insert({
        user_id: user.id,
        display_name: displayName.trim(),
        age: Number(age),
        avatar,
        interests,
        communication_style: communicationStyle || null,
        bio: bio.trim() || null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      handleClose();
      onChildAdded();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add a Child</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Step indicators */}
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Name & Age */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                placeholder="A fun nickname for your child"
                maxLength={30}
              />
              <p className="text-xs text-gray-400 mt-1">This is what other kids will see (not their real name)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <select
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all bg-white"
              >
                <option value="">Select age</option>
                {Array.from({ length: 9 }, (_, i) => i + 5).map((a) => (
                  <option key={a} value={a}>{a} years old</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Avatar */}
        {step === 2 && (
          <div>
            <p className="text-gray-600 mb-4">Pick an avatar for your child</p>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`text-4xl p-3 rounded-2xl transition-all ${
                    avatar === a
                      ? "bg-green-100 ring-2 ring-green-400 scale-110"
                      : "bg-gray-50 hover:bg-gray-100"
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
            <p className="text-gray-600 mb-4">What does your child enjoy? (pick at least 1)</p>
            <div className="grid grid-cols-3 gap-3">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.label}
                  onClick={() => toggleInterest(interest.label)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl text-sm font-medium transition-all ${
                    interests.includes(interest.label)
                      ? "bg-green-100 ring-2 ring-green-400"
                      : "bg-gray-50 hover:bg-gray-100"
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
              <label className="block text-sm font-medium text-gray-700 mb-3">Communication Style</label>
              <div className="grid grid-cols-1 gap-3">
                {COMMUNICATION_STYLES.map((style) => (
                  <button
                    key={style.label}
                    onClick={() => setCommunicationStyle(style.label)}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                      communicationStyle === style.label
                        ? "bg-green-100 ring-2 ring-green-400"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-2xl">{style.emoji}</span>
                    <div>
                      <p className="font-medium text-gray-800">{style.label}</p>
                      <p className="text-xs text-gray-500">{style.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Short Bio (optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none"
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
              className="px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
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
              {isSubmitting ? "Adding..." : "Add Child"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
