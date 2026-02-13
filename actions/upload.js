"use server";

import { uploadFile } from "@/lib/upload";
import { supabaseServer } from "@/lib/supabase-server";

export async function uploadCredentialAction(formData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("file");
  if (!file) throw new Error("No file provided");

  try {
    const publicUrl = await uploadFile(file, "credentials", `credential-${user.id}`);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(error.message || "Failed to upload credential");
  }
}
