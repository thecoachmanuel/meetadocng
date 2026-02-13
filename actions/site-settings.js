"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

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

  const settings = Object.fromEntries(formData.entries());
  await ensure();
  try {
    await db.siteSettings.update({ where: { id: "singleton" }, data: settings });
  } catch (e) {
    throw new Error("Site settings table not found. Please run database migration.");
  }
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function uploadSiteAsset(formData) {
  const supabase = await supabaseServer();
  const admin = supabaseAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const bucket = "site";
  await admin.storage.createBucket(bucket).catch(() => {});

  const file = formData.get("file");
  const target = formData.get("target"); // logoUrl | faviconUrl | heroImageUrl
  if (!file || !target) throw new Error("Invalid upload");
  const path = `${target}-${Date.now()}-${file.name}`;

  const up = await admin.storage.from(bucket).upload(path, file, { upsert: true });
  if (up.error) throw new Error(up.error.message);
  const pub = admin.storage.from(bucket).getPublicUrl(path);
  await ensure();
  try {
    await db.siteSettings.update({
      where: { id: "singleton" },
      data: { [target]: pub.data.publicUrl },
    });
  } catch (e) {
    throw new Error("Site settings table not found. Please run database migration.");
  }
  revalidatePath("/");
  return { success: true, url: pub.data.publicUrl };
}
