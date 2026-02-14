import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedMatchers = [
  "/doctors(.*)",
  "/onboarding(.*)",
  "/doctor(.*)",
  "/admin(.*)",
  "/video-call(.*)",
  "/appointments(.*)",
];

export default async function proxy(req) {
  const res = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return res;
  }
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => req.cookies.get(name)?.value,
      set: (name, value, options) => res.cookies.set(name, value, options),
      remove: (name, options) => res.cookies.set(name, "", { ...options, maxAge: 0 }),
    },
  });

  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  const url = new URL(req.url);
  const isProtected = protectedMatchers.some((pattern) =>
    new RegExp(pattern.replaceAll("/", "\\/").replace("(.*)", ".*")).test(
      url.pathname
    )
  );

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
