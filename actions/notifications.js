"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";

export async function getUserNotifications() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const authUser = data?.user || null;

  if (!authUser) {
    return { items: [], unreadCount: 0 };
  }

  const email = authUser.email?.toLowerCase() || "";

  const user = await db.user.findFirst({
    where: {
      OR: [{ supabaseUserId: authUser.id }, { email }],
    },
    select: { id: true },
  });

  if (!user) {
    return { items: [], unreadCount: 0 };
  }

  const announcements = await db.announcement.findMany({
    where: {
      OR: [
        { scope: "GLOBAL" },
        { scope: "USER", targetUserId: user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (announcements.length === 0) {
    return { items: [], unreadCount: 0 };
  }

  const announcementIds = announcements.map((a) => a.id);

  const reads = await db.announcementRead.findMany({
    where: {
      announcementId: { in: announcementIds },
      userId: user.id,
    },
    select: { announcementId: true },
  });

  const readSet = new Set(reads.map((r) => r.announcementId));

  const items = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    createdAt: a.createdAt,
    scope: a.scope,
    read: readSet.has(a.id),
  }));

  const unreadCount = items.filter((i) => !i.read).length;

  return { items, unreadCount };
}

export async function markAllNotificationsRead() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const authUser = data?.user || null;

  if (!authUser) {
    return { success: false };
  }

  const email = authUser.email?.toLowerCase() || "";

  const user = await db.user.findFirst({
    where: {
      OR: [{ supabaseUserId: authUser.id }, { email }],
    },
    select: { id: true },
  });

  if (!user) {
    return { success: false };
  }

  const announcements = await db.announcement.findMany({
    where: {
      OR: [
        { scope: "GLOBAL" },
        { scope: "USER", targetUserId: user.id },
      ],
    },
    select: { id: true },
  });

  if (announcements.length === 0) {
    return { success: true };
  }

  const existing = await db.announcementRead.findMany({
    where: {
      userId: user.id,
      announcementId: { in: announcements.map((a) => a.id) },
    },
    select: { announcementId: true },
  });

  const existingSet = new Set(existing.map((r) => r.announcementId));

  const toCreate = announcements
    .filter((a) => !existingSet.has(a.id))
    .map((a) => ({
      announcementId: a.id,
      userId: user.id,
    }));

  if (toCreate.length > 0) {
    await db.announcementRead.createMany({ data: toCreate, skipDuplicates: true });
  }

  return { success: true };
}

export async function markNotificationRead(announcementId) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const authUser = data?.user || null;

  if (!authUser) {
    return { success: false };
  }

  const email = authUser.email?.toLowerCase() || "";

  const user = await db.user.findFirst({
    where: {
      OR: [{ supabaseUserId: authUser.id }, { email }],
    },
    select: { id: true },
  });

  if (!user) {
    return { success: false };
  }

  if (!announcementId) {
    return { success: false };
  }

  await db.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId,
        userId: user.id,
      },
    },
    create: {
      announcementId,
      userId: user.id,
    },
    update: {},
  });

  return { success: true };
}
