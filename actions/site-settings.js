"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/lib/upload";

async function ensure() {
  // Intentionally no-op to avoid crashing when table doesn't exist
}

export async function getSiteSettings() {
  await ensure();
  try {
    return await db.siteSettings.findUnique({ where: { id: "singleton" } });
  } catch {
    return null;
  }
}

export async function updateSiteSettings(formData) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const siteTitle = formData.get("siteTitle");
  const logoUrl = formData.get("logoUrl");
  const faviconUrl = formData.get("faviconUrl");
  const heroImageUrl = formData.get("heroImageUrl");
  const homepageSections = formData.get("homepageSections");

  await ensure();
  try {
    await db.siteSettings.update({
      where: { id: "singleton" },
      data: {
        siteTitle,
        logoUrl,
        faviconUrl,
        heroImageUrl,
        homepageSections: homepageSections ? JSON.parse(homepageSections) : undefined,
      },
    });
  } catch (e) {
    console.error("Update site settings error:", e);
    throw new Error("Failed to update site settings. Please check your database connection.");
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { success: true };
}

export async function uploadSiteAsset(formData) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("file");
  const target = formData.get("target"); // logoUrl | faviconUrl | heroImageUrl
  if (!file || !target) throw new Error("Invalid upload");

  try {
    const publicUrl = await uploadFile(file, "site", target);
    
    await ensure();
    await db.siteSettings.update({
      where: { id: "singleton" },
      data: { [target]: publicUrl },
    });

    revalidatePath("/", "layout");
    return { success: true, url: publicUrl };
  } catch (e) {
    throw new Error(e.message || "Failed to upload site asset");
  }
}
