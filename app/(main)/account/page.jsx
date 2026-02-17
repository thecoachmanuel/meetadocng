"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase-client";
import { updateProfile, deleteAvatar } from "@/actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { changePassword } from "@/actions/profile";
import Image from "next/image";

export default function AccountPage() {
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseClient.auth.getUser();
      const u = data.user;
      if (!u) return;
      setFullName(u.user_metadata?.full_name || "");
      setAvatarUrl(u.user_metadata?.avatar_url || "");
    };
    load();
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("fullName", fullName);
    if (avatarUrl) fd.append("avatarUrl", avatarUrl);
    await updateProfile(fd);
    toast.success("Account updated");
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const { data } = await supabaseClient.auth.getUser();
    const u = data.user;
    const fdUpload = new FormData();
    fdUpload.append("file", file);
    fdUpload.append("folder", `avatars/${u.id}`);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fdUpload,
      });
      const dataJson = await res.json();
      if (!res.ok || !dataJson?.url) {
        throw new Error(dataJson?.error || "Upload failed");
      }
      setAvatarUrl(dataJson.url);
      const fd = new FormData();
      fd.append("avatarUrl", dataJson.url);
      await updateProfile(fd);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  const onDeleteAvatar = async () => {
    setLoading(true);
    await deleteAvatar();
    setAvatarUrl("");
    setLoading(false);
    toast.success("Avatar deleted");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="profile">
        <TabsList className="bg-muted/30 border h-14 w-full p-2 rounded-md">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="bg-muted/20 border-emerald-900/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">My Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={onSave} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="avatar" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <Input type="file" accept="image/*" onChange={onAvatarChange} disabled={loading} />
                    <Button type="button" variant="outline" onClick={onDeleteAvatar} disabled={loading} className="border-emerald-900/30">Delete</Button>
                  </div>
                </div>

                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card className="bg-muted/20 border-emerald-900/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  try {
                    await changePassword(fd);
                    e.currentTarget.reset();
                    toast.success("Password updated");
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" name="newPassword" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Change Password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
