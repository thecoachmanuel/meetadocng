import { NextResponse } from "next/server";
import { purchaseCredits } from "@/actions/credits";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const reference = body?.reference;

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Payment configuration missing" }, { status: 500 });
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: "Failed to verify payment" }, { status: 502 });
    }

    const payload = await verifyResponse.json();
    const data = payload?.data;

    if (!data || data.status !== "success") {
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
    }

    const metadata = data.metadata || {};
    const userId = metadata.userId;
    const plan = metadata.plan;

    if (!userId || !plan) {
      return NextResponse.json({ error: "Incomplete payment metadata" }, { status: 400 });
    }

    const result = await purchaseCredits(userId, plan);

    if (!result?.success) {
      return NextResponse.json({ error: result?.error || "Failed to allocate credits" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

