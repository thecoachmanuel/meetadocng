const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!envPath || typeof envPath !== "string") return;
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

async function ensureAuthUser(admin, email, password) {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (list.error) throw list.error;
  const existing = (list.data?.users || []).find(
    (u) => (u.email || "").toLowerCase() === email.toLowerCase()
  );
  if (!existing) {
    const createRes = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createRes.error) throw createRes.error;
    return createRes.data.user.id;
  } else {
    const upd = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (upd.error) throw upd.error;
    return existing.id;
  }
}

async function signIn(anon, email, password) {
  const res = await anon.auth.signInWithPassword({ email, password });
  if (res.error) throw res.error;
  return res.data.session;
}

async function callMe(baseUrl, session) {
  const meRes = await fetch(`${baseUrl}/api/me`, {
    method: "POST",
    headers: {
      Cookie: `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`,
    },
  });
  return meRes.json();
}

async function main() {
  loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const baseUrl = "http://localhost:3000";

  const admin = createClient(supabaseUrl, serviceKey);
  const anon = createClient(supabaseUrl, anonKey);
  const db = new PrismaClient();

  const patientEmail = "patient@example.com";
  const patientPass = "test12345";
  const doctorEmail = "doctor@example.com";
  const doctorPass = "doc12345";

  const patientId = await ensureAuthUser(admin, patientEmail, patientPass);
  const doctorId = await ensureAuthUser(admin, doctorEmail, doctorPass);

  const patientSession = await signIn(anon, patientEmail, patientPass);
  await callMe(baseUrl, patientSession);
  const doctorSession = await signIn(anon, doctorEmail, doctorPass);
  await callMe(baseUrl, doctorSession);

  await db.user.upsert({
    where: { supabaseUserId: patientId },
    create: { supabaseUserId: patientId, email: patientEmail, role: "PATIENT" },
    update: { role: "PATIENT" },
  });

  await db.user.upsert({
    where: { supabaseUserId: doctorId },
    create: {
      supabaseUserId: doctorId,
      email: doctorEmail,
      role: "DOCTOR",
      specialty: "General Medicine",
      experience: 5,
      credentialUrl: "https://example.com/credential.pdf",
      description: "General practitioner",
      verificationStatus: "VERIFIED",
    },
    update: {
      role: "DOCTOR",
      specialty: "General Medicine",
      experience: 5,
      credentialUrl: "https://example.com/credential.pdf",
      description: "General practitioner",
      verificationStatus: "VERIFIED",
    },
  });

  // Ensure availability exists for the doctor: now to 3 hours ahead
  const now = new Date();
  const threeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const existingAvail = await db.availability.findFirst({
    where: { doctorId: doctorId },
  });
  if (!existingAvail) {
    await db.availability.create({
      data: {
        doctorId: doctorId,
        startTime: now,
        endTime: threeHours,
        status: "AVAILABLE",
      },
    });
  }

  await db.$disconnect();
  console.log("Seeded patient and doctor test users");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
