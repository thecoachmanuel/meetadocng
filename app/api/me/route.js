import { NextResponse } from "next/server";
import { checkUser } from "@/lib/checkUser";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await checkUser();
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

