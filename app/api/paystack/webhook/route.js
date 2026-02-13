import { NextResponse } from "next/server";
import crypto from "crypto";
import { purchaseCredits } from "@/actions/credits";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = request.headers.get("x-paystack-signature");

    if (!secret || !signature) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload?.event;
    const data = payload?.data;

    if (event === "charge.success") {
      const metadata = data?.metadata || {};
      const userId = metadata.userId;
      const plan = metadata.plan;

      if (userId && plan) {
        await purchaseCredits(userId, plan);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

