"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
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

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);

  const [parentName, setParentName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaveMsg, setNameSaveMsg] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const fetchChildren = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("children")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    setChildren(data ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setParentName(user.user_metadata?.parent_name ?? "");
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      await fetchChildren(user.id);
      setLoading(false);
    };
    init();
  }, [router, fetchChildren]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be under 5 MB.");
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError(null);

    // Show a local preview immediately while uploading
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setPhotoError(uploadError.message);
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      setIsUploadingPhoto(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setAvatarUrl(publicUrl);
    setIsUploadingPhoto(false);

    // Reset file input so the same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    await supabase.auth.updateUser({ data: { avatar_url: null } });
    setAvatarUrl(null);
  };

  const handleSaveName = async () => {
    setIsSavingName(true);
    setNameSaveMsg(null);
    const { error } = await supabase.auth.updateUser({ data: { parent_name: parentName.trim() } });
    setIsSavingName(false);
    setNameSaveMsg(error ? `Error: ${error.message}` : "Saved!");
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    setIsSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSavingPassword(false);
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMsg("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    }
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

  const displayParentName = user?.user_metadata?.parent_name || user?.email?.split("@")[0] || "Parent";
  const initials = displayParentName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNav parentName={displayParentName} onLogout={handleLogout} avatarUrl={avatarUrl} />

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Account Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Update your profile and manage your children&apos;s information</p>
        </div>

        {/* Parent Info */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Parent Info</h2>

          {/* Profile photo */}
          <div className="flex items-center gap-5">
            <div className="relative group flex-shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="w-20 h-20 rounded-full overflow-hidden bg-green-100 dark:bg-green-900/40 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">{initials}</span>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-semibold">
                    {isUploadingPhoto ? "Uploading…" : "Change"}
                  </span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</p>
              <p className="text-xs text-gray-400">JPG, PNG or GIF · max 5 MB</p>
              {isUploadingPhoto && <p className="text-xs text-green-600 font-medium">Uploading…</p>}
              {photoError && <p className="text-xs text-red-500">{photoError}</p>}
              {avatarUrl && !isUploadingPhoto && (
                <button
                  onClick={handleRemovePhoto}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => { setParentName(e.target.value); setNameSaveMsg(null); }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              maxLength={60}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <p className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
              {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveName}
              disabled={isSavingName || !parentName.trim()}
              className="btn-primary px-6 py-2.5 disabled:opacity-40"
            >
              {isSavingName ? "Saving..." : "Save Changes"}
            </button>
            {nameSaveMsg && (
              <span className={`text-sm font-medium ${nameSaveMsg.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
                {nameSaveMsg}
              </span>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Change Password</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); setPasswordMsg(null); }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); setPasswordMsg(null); }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
              placeholder="Repeat your new password"
            />
          </div>
          {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          {passwordMsg && <p className="text-sm text-green-600 font-medium">{passwordMsg}</p>}
          <button
            onClick={handleChangePassword}
            disabled={isSavingPassword || !newPassword || !confirmPassword}
            className="btn-primary px-6 py-2.5 disabled:opacity-40"
          >
            {isSavingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>

        {/* Your Children */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Your Children</h2>
          {children.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🧸</div>
              <p className="text-gray-500 dark:text-gray-400">No children added yet. Head to the Home tab to add one!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {children.map((child) => (
                <div key={child.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                    {child.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{child.display_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{child.age} years old</p>
                    {child.interests.length > 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {child.interests.join(", ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingChild(child)}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {editingChild && (
        <EditChildModal
          isOpen={true}
          onClose={() => setEditingChild(null)}
          onChildUpdated={() => { if (user) fetchChildren(user.id); }}
          child={editingChild}
        />
      )}
    </div>
  );
}
