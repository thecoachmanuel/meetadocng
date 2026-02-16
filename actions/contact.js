"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";

export async function createContactMessage(formData) {
  const rawName = formData.get("name");
  const rawEmail = formData.get("email");
  const rawSubject = formData.get("subject");
  const rawMessage = formData.get("message");

  const name = typeof rawName === "string" ? rawName.trim() : "";
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const subject = typeof rawSubject === "string" ? rawSubject.trim() : "";
  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

  if (!name || !email || !subject || !message) {
    throw new Error("All fields are required");
  }

  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const authUser = data?.user || null;

  let userId = null;
  if (authUser?.id) {
    const existing = await db.user.findFirst({
      where: {
        OR: [{ supabaseUserId: authUser.id }, { email }],
      },
      select: { id: true },
    });
    if (existing) {
      userId = existing.id;
    }
  }

  await db.contactMessage.create({
    data: {
      userId,
      name,
      email,
      subject,
      message,
    },
  });

  return { success: true };
}

