"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function ensureBucket(name) {
  const admin = supabaseAdmin();
  const existing = await admin.storage.getBucket(name);
  if (!existing.data) {
    await admin.storage.createBucket(name, { public: true });
  }
  return { ok: true };
}

