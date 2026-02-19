import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkUser } from "@/lib/checkUser";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://meetadoc-ng.vercel.app";
  const res = NextResponse.redirect(new URL("/", siteUrl));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !code) {
    return res;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => req.cookies.get(name)?.value,
      set: (name, value, options) => res.cookies.set(name, value, options),
      remove: (name, options) => res.cookies.set(name, "", { ...options, maxAge: 0 }),
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return res;
  }

  const { data, error: userError } = await supabase.auth.getUser();
  const authUser = data?.user;

  if (userError || !authUser) {
    return res;
  }

  const dbUser = await checkUser(authUser);

  const role = dbUser?.role || "UNASSIGNED";
  const redirectMap = {
    ADMIN: "/admin",
    DOCTOR: "/doctor",
    PATIENT: "/appointments",
    UNASSIGNED: "/onboarding",
  };
  const target = redirectMap[role] || "/";
  res.headers.set("Location", new URL(target, siteUrl).toString());
  return res;
}
