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

async function signIn(email, password) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, anonKey);
  const res = await supabase.auth.signInWithPassword({ email, password });
  if (res.error) throw res.error;
  return res.data.session;
}

async function main() {
	loadEnv();
	const db = new PrismaClient();
	const baseUrl = "http://localhost:3000";
	const patientSession = await signIn("patient@example.com", "test12345");
	const doctorSession = await signIn("doctor@example.com", "doc12345");
	const patient = await db.user.findUnique({ where: { email: "patient@example.com" } });
	const doctor = await db.user.findUnique({ where: { email: "doctor@example.com" } });
	console.log("db patient role", patient?.role);
	console.log("db doctor role", doctor?.role);

	const patientMeRes = await fetch(`${baseUrl}/api/me`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${patientSession.access_token}`,
		},
		body: JSON.stringify({ accessToken: patientSession.access_token }),
	});
	const patientMe = await patientMeRes.json();
	console.log("/api/me patient", JSON.stringify(patientMe));

	const doctorMeRes = await fetch(`${baseUrl}/api/me`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${doctorSession.access_token}`,
		},
		body: JSON.stringify({ accessToken: doctorSession.access_token }),
	});
	const doctorMe = await doctorMeRes.json();
	console.log("/api/me doctor", JSON.stringify(doctorMe));

	const targetEmail = "olaitanadewale@gmail.com";
	const targetUser = await db.user.findUnique({ where: { email: targetEmail } });
	console.log("db target user", targetEmail, JSON.stringify(targetUser));

	await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
