"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Unauthorized");
  const user = data.user;

  const fullName = formData.get("fullName") || undefined;
  const avatarUrl = formData.get("avatarUrl") || undefined;

  if (!fullName && !avatarUrl) return { success: true };

  if (fullName || avatarUrl) {
    await supabase.auth.updateUser({
      data: {
        ...(fullName ? { full_name: fullName } : {}),
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      },
    });
  }

  await db.user.update({
    where: { supabaseUserId: user.id },
    data: {
      ...(fullName ? { name: fullName } : {}),
      ...(avatarUrl ? { imageUrl: avatarUrl } : {}),
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function deleteAvatar() {
  const supabase = await supabaseServer();
  const admin = supabaseAdmin();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Unauthorized");
  const user = data.user;

  const dbUser = await db.user.findUnique({ where: { supabaseUserId: user.id } });
  const url = dbUser?.imageUrl || user.user_metadata?.avatar_url || "";
  if (url) {
    const idx = url.indexOf("/object/public/");
    if (idx !== -1) {
      const pathPart = url.slice(idx + "/object/public/".length);
      const bucket = pathPart.split("/")[0];
      const objectPath = pathPart.slice(bucket.length + 1);
      await admin.storage.from(bucket).remove([objectPath]);
    }
  }

  await supabase.auth.updateUser({ data: { avatar_url: null } });
  await db.user.update({ where: { supabaseUserId: user.id }, data: { imageUrl: null } });
  revalidatePath("/");
  return { success: true };
}

export async function changePassword(formData) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Unauthorized");
  const user = data.user;

  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (!newPassword || !confirmPassword) {
    throw new Error("Password is required");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  await supabase.auth.updateUser({ password: newPassword });
  return { success: true };
}
