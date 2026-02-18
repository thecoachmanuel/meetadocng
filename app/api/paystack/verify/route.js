import { NextResponse } from "next/server";
import { purchaseCredits } from "@/actions/credits";
import { db } from "@/lib/prisma";

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

		const metadata = data?.metadata || {};
		const userId = metadata.userId;
		const plan = metadata.plan;
		const amount = data?.amount;
		const paidAt = data?.paid_at ? new Date(data.paid_at) : null;
		const status = data?.status === "success" ? "SUCCESS" : "FAILED";
		const referenceFromPaystack = data?.reference;
		const channel = data?.channel;
		const gatewayCode = data?.gateway_response || null;
		const gatewayMessage = data?.message || data?.gateway_response || null;

		try {
			const existing = referenceFromPaystack
				? await db.payment.findUnique({
					where: { reference: referenceFromPaystack },
				})
				: null;

			if (existing) {
				await db.payment.update({
					where: { id: existing.id },
					data: {
						status,
						amount: typeof amount === "number" ? amount : existing.amount,
						paidAt,
						channel,
						gatewayCode,
						gatewayMessage,
						plan: plan || existing.plan,
						userId: userId || existing.userId,
					},
				});
			} else {
				await db.payment.create({
					data: {
						userId: userId || null,
						email: data?.customer?.email || null,
						amount: typeof amount === "number" ? amount : 0,
						currency: (data?.currency || "NGN") ?? "NGN",
						plan: plan || null,
						status,
						provider: "PAYSTACK",
						reference: referenceFromPaystack || reference,
						channel,
						gatewayCode,
						gatewayMessage,
						paidAt,
					},
				});
			}
		} catch (e) {}

		if (status !== "SUCCESS") {
			return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
		}

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
