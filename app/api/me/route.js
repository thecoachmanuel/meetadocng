import { NextResponse } from "next/server";
import { checkUser } from "@/lib/checkUser";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    let user = null;

    const authHeader = request.headers.get("authorization") || "";
    const lower = authHeader.toLowerCase();

    if (lower.startsWith("bearer ")) {
      const token = authHeader.slice(7).trim();
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (url && anonKey && token) {
        const client = createClient(url, anonKey);
        const { data, error } = await client.auth.getUser(token);
        const authUser = data?.user;

        if (!error && authUser) {
          user = await checkUser(authUser);
        }
      }
    }

    if (!user) {
      user = await checkUser();
    }

    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
