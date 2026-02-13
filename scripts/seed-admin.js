const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnv();

  const email = "meetadocng@gmail.com";
  const password = "admin123";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase configuration");
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let userId = null;

  const listRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listRes.error) throw listRes.error;
  const existing = (listRes.data?.users || []).find(
    (u) => (u.email || "").toLowerCase() === email.toLowerCase()
  );

  if (!existing) {
    const createRes = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createRes.error) throw createRes.error;
    userId = createRes.data.user.id;
  } else {
    userId = existing.id;
    const updRes = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (updRes.error) throw updRes.error;
  }

  const db = new PrismaClient();
  try {
    const byId = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (byId) {
      await db.user.update({
        where: { clerkUserId: userId },
        data: { role: "ADMIN", email },
      });
    } else {
      const byEmail = await db.user.findUnique({ where: { email } });
      if (byEmail) {
        await db.user.update({
          where: { email },
          data: { clerkUserId: userId, role: "ADMIN" },
        });
      } else {
        await db.user.create({
          data: {
            clerkUserId: userId,
            email,
            name: "Admin",
            role: "ADMIN",
          },
        });
      }
    }
  } finally {
    await db.$disconnect();
  }

  console.log("Seeded admin:", email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

