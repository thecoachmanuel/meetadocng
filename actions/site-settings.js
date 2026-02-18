"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { getCloudinary } from "@/lib/cloudinary";
import { requireAdminSection } from "@/actions/admin";

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
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Unauthorized");
  const user = data.user;

  await requireAdminSection("settings");

  const rawSettings = Object.fromEntries(formData.entries());
  const settings = { ...rawSettings };

  if (typeof settings.homepageSections === "string") {
    try {
      settings.homepageSections = JSON.parse(settings.homepageSections);
    } catch {
      delete settings.homepageSections;
    }
  }

  const intFields = [
    "appointmentCreditCost",
    "doctorEarningPerCredit",
    "creditToNairaRate",
    "adminEarningPercentage",
    "freeCredits",
    "standardCredits",
    "premiumCredits",
  ];

  intFields.forEach((key) => {
    if (settings[key] !== undefined) {
      const n = Number(settings[key]);
      if (Number.isFinite(n)) {
        settings[key] = n;
      } else {
        delete settings[key];
      }
    }
  });
  await ensure();
  try {
    await db.siteSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        ...settings,
      },
      update: settings,
    });
  } catch (e) {
    throw new Error("Site settings table not found. Please run database migration.");
  }
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function uploadSiteAsset(formData) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Unauthorized");

  const file = formData.get("file");
  const target = formData.get("target"); // logoUrl | faviconUrl | heroImageUrl
  if (!file || typeof file === "string" || !target) throw new Error("Invalid upload");

  const mime = file.type || "";
  if (!mime.startsWith("image/")) {
    throw new Error("Only image uploads are allowed for site assets");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const cloudinary = getCloudinary();

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "meetadoc/site",
        resource_type: "image",
        public_id: `${target}-${Date.now()}`,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });

  const publicUrl = uploadResult.secure_url;
  await ensure();
  try {
    await db.siteSettings.update({
      where: { id: "singleton" },
      data: { [target]: publicUrl },
    });
  } catch (e) {
    throw new Error("Site settings table not found. Please run database migration.");
  }
  revalidatePath("/", "layout");
  return { success: true, url: publicUrl };
}
