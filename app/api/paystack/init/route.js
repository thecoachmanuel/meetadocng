import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
	try {
		const body = await request.json().catch(() => null);
		const email = body?.email;
		const userId = body?.userId;
		const plan = body?.plan;
		const amount = body?.amount;

		if (!email || !userId || !plan || !amount) {
			return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
		}

		const secret = process.env.PAYSTACK_SECRET_KEY;
		if (!secret) {
			return NextResponse.json({ error: "Payment configuration missing" }, { status: 500 });
		}

		const initResponse = await fetch("https://api.paystack.co/transaction/initialize", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${secret}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				email,
				amount,
				currency: "NGN",
				metadata: {
					userId,
					plan,
				},
			}),
		});

		if (!initResponse.ok) {
			return NextResponse.json({ error: "Failed to start payment" }, { status: 502 });
		}

		const payload = await initResponse.json().catch(() => null);
		const data = payload?.data;
		const authorizationUrl = data?.authorization_url;
		const reference = data?.reference;

		if (!authorizationUrl) {
			return NextResponse.json({ error: "Invalid payment response" }, { status: 500 });
		}

		try {
			await db.payment.create({
				data: {
					userId,
					email,
					amount,
					currency: "NGN",
					plan,
					status: "PENDING",
					provider: "PAYSTACK",
					reference,
				},
			});
		} catch (e) {}

		return NextResponse.json({ authorizationUrl });
	} catch (e) {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
