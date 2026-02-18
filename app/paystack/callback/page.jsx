"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function PaystackCallbackPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [status, setStatus] = useState("verifying"); // verifying | success | error
	const [message, setMessage] = useState("Verifying your payment...");

	useEffect(() => {
		const reference = searchParams.get("reference");
		if (!reference) {
			setStatus("error");
			setMessage("Missing payment reference. Please contact support if you were charged.");
			return;
		}

		const verify = async () => {
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
					setMessage(data?.error || "We couldn't verify your payment. If you were charged, please contact support.");
					return;
				}
				setStatus("success");
				setMessage("Payment verified. Your credits have been added to your account.");
				setTimeout(() => {
					router.push("/appointments");
				}, 2500);
			} catch (e) {
				setStatus("error");
				setMessage("Network error while verifying payment. If you were charged, please contact support.");
			}
		};

		verify();
	}, [searchParams, router]);

	return (
		<div className="min-h-[60vh] flex items-center justify-center px-4">
			<Card className="max-w-md w-full bg-muted/20 border-emerald-900/30">
				<CardHeader className="flex flex-col items-center gap-2">
					{status === "verifying" && <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />}
					{status === "success" && <CheckCircle2 className="h-8 w-8 text-emerald-400" />}
					{status === "error" && <XCircle className="h-8 w-8 text-red-400" />}
					<CardTitle className="text-lg text-white">
						{status === "verifying" && "Finishing up your payment"}
						{status === "success" && "Payment successful"}
						{status === "error" && "Payment verification"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground text-center">{message}</p>
				</CardContent>
			</Card>
		</div>
	);
}

