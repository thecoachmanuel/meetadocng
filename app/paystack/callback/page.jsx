"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function PaystackCallbackPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [status, setStatus] = useState("verifying");
	const [message, setMessage] = useState("Verifying your payment...");

	useEffect(() => {
		const reference = searchParams.get("reference") || searchParams.get("trxref");
		if (!reference) {
			setStatus("error");
			setMessage("Missing payment reference. If you were charged, please contact support.");
			return;
		}

		const verifyPayment = async () => {
			try {
				const res = await fetch("/api/paystack/verify", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ reference }),
				});
				const data = await res.json().catch(() => null);

				if (!res.ok || !data?.success) {
					setStatus("error");
					setMessage(
						data?.error ||
							"We could not verify your payment. If you were charged, please contact support."
					);
					return;
				}

				setStatus("success");
				setMessage("Payment verified successfully. Your credits have been added to your account.");
				setTimeout(() => {
					router.push("/appointments");
				}, 2000);
			} catch {
				setStatus("error");
				setMessage(
					"Network error while verifying payment. If you were charged, please contact support."
				);
			}
		};

		verifyPayment();
	}, [searchParams, router]);

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<Card className="max-w-md w-full border-emerald-900/30 bg-background">
				<CardHeader className="text-center space-y-2">
					<CardTitle className="text-xl font-bold text-white">
						{status === "verifying" && "Verifying Payment"}
						{status === "success" && "Payment Successful"}
						{status === "error" && "Payment Verification Failed"}
					</CardTitle>
					<CardDescription className="text-muted-foreground">{message}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col items-center space-y-4">
					{status === "verifying" && (
						<Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
					)}
					{status === "success" && <CheckCircle2 className="h-10 w-10 text-emerald-400" />}
					{status === "error" && <XCircle className="h-10 w-10 text-red-500" />}
					{status === "error" && (
						<div className="flex gap-3">
							<Button variant="outline" onClick={() => router.push("/")}>
								Go Home
							</Button>
							<Button onClick={() => router.push("/appointments")}>
								View Appointments
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
