const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

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
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const baseUrl = "http://localhost:3000";

  const supabase = createClient(supabaseUrl, anonKey);
  const res = await supabase.auth.signInWithPassword({ email, password });
  if (res.error) throw res.error;
  const { access_token, refresh_token } = res.data.session;

  const meRes = await fetch(`${baseUrl}/api/me`, {
    method: "POST",
    headers: {
      Cookie: `sb:token=${access_token}; sb:refresh-token=${refresh_token}`,
    },
  });
  const json = await meRes.json();
  console.log(JSON.stringify(json));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
