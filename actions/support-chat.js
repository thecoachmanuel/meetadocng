"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";

async function getCurrentUser() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const authUser = data?.user || null;

  if (!authUser) return null;

  const email = authUser.email?.toLowerCase() || "";

  const user = await db.user.findFirst({
    where: {
      OR: [{ supabaseUserId: authUser.id }, { email }],
    },
  });

  return user;
}

async function getPrimaryAdmin() {
  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  return admin;
}

export async function getSupportOverview() {
  const user = await getCurrentUser();
  if (!user) {
    return { currentUser: null, isAdmin: false, conversations: [], messages: [] };
  }

  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    const admin = await getPrimaryAdmin();
    if (!admin) {
      return { currentUser: user, isAdmin, conversations: [], messages: [] };
    }

    const messages = await db.supportMessage.findMany({
      where: {
        OR: [
          { fromId: user.id, toId: admin.id },
          { fromId: admin.id, toId: user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        from: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return {
      currentUser: user,
      isAdmin,
      conversations: [],
      messages,
      activeUserId: admin.id,
    };
  }

  const rows = await db.supportMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      from: { select: { id: true, name: true, email: true, role: true } },
      to: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const byUser = new Map();

  for (const msg of rows) {
    const other = msg.fromId === user.id ? msg.to : msg.from;
    if (!other) continue;
    const existing = byUser.get(other.id);
    if (!existing || existing.lastMessage.createdAt < msg.createdAt) {
      byUser.set(other.id, {
        user: other,
        lastMessage: {
          id: msg.id,
          createdAt: msg.createdAt,
          body: msg.body,
          fromId: msg.fromId,
        },
      });
    }
  }

  const conversations = Array.from(byUser.values()).sort((a, b) => {
    return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
  });

  let activeUserId = null;
  if (conversations.length > 0) {
    activeUserId = conversations[0].user.id;
  }

  let messages = [];
  if (activeUserId) {
    messages = await getSupportMessagesForUserId(activeUserId, user.id);
  }

  return {
    currentUser: user,
    isAdmin,
    conversations,
    messages,
    activeUserId,
  };
}

export async function getSupportMessagesForUserId(targetUserId, currentUserIdOverride) {
  const current = currentUserIdOverride
    ? await db.user.findUnique({ where: { id: currentUserIdOverride } })
    : await getCurrentUser();

  if (!current) {
    return [];
  }

  const isAdmin = current.role === "ADMIN";

  if (!isAdmin) {
    const admin = await getPrimaryAdmin();
    if (!admin) return [];

    const messages = await db.supportMessage.findMany({
      where: {
        OR: [
          { fromId: current.id, toId: admin.id },
          { fromId: admin.id, toId: current.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: {
        from: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return messages;
  }

  if (!targetUserId) return [];

  const messages = await db.supportMessage.findMany({
    where: {
      OR: [
        { fromId: current.id, toId: targetUserId },
        { fromId: targetUserId, toId: current.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      from: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return messages;
}

export async function sendSupportMessage(formData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be signed in to send a message");
  }

  const rawBody = formData.get("body");
  const rawTargetUserId = formData.get("targetUserId");

  const body = typeof rawBody === "string" ? rawBody.trim() : "";

  if (!body) {
    throw new Error("Message cannot be empty");
  }

  let toId = null;

  if (user.role === "ADMIN") {
    const targetUserId = typeof rawTargetUserId === "string" ? rawTargetUserId : "";
    if (!targetUserId) {
      throw new Error("Target user is required");
    }
    toId = targetUserId;
  } else {
    const admin = await getPrimaryAdmin();
    if (!admin) {
      throw new Error("Support team is not available yet");
    }
    toId = admin.id;
  }

  const message = await db.supportMessage.create({
    data: {
      fromId: user.id,
      toId,
      body,
    },
    include: {
      from: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return { success: true, message };
}

