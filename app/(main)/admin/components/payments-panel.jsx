"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { formatNaira } from "@/lib/currency";

const STATUS_OPTIONS = [
	{ value: "ALL", label: "All" },
	{ value: "SUCCESS", label: "Successful" },
	{ value: "FAILED", label: "Failed" },
	{ value: "PENDING", label: "Pending" },
];

export default function PaymentsPanel({ payments }) {
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		return (payments || []).filter((payment) => {
			if (statusFilter !== "ALL" && payment.status !== statusFilter) {
				return false;
			}
			if (!query) return true;
			const q = query.toLowerCase();
			const email = payment.email || payment.user?.email || "";
			const name = payment.user?.name || "";
			const reference = payment.reference || "";
			return (
				email.toLowerCase().includes(q) ||
				name.toLowerCase().includes(q) ||
				reference.toLowerCase().includes(q)
			);
		});
	}, [payments, statusFilter, query]);

	return (
		<Card className="bg-muted/20 border-emerald-900/20">
			<CardHeader>
				<CardTitle className="text-xl font-bold text-white">Payments</CardTitle>
				<CardDescription className="text-muted-foreground">
					Track all Paystack payment attempts, including successful and failed charges.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
					<div className="flex gap-3 w-full md:w-auto">
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-[160px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								{STATUS_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Input
						placeholder="Search by email, name, or reference"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="md:max-w-xs"
					/>
				</div>

				<div className="border border-emerald-900/30 rounded-lg overflow-hidden">
					<div className="grid grid-cols-6 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
						<div>User</div>
						<div>Email</div>
						<div>Amount</div>
						<div>Status</div>
						<div>Reference</div>
						<div>Date</div>
					</div>
					{filtered.length === 0 ? (
						<div className="px-3 py-6 text-sm text-muted-foreground text-center">
							No payments found for the selected filters.
						</div>
					) : (
						<div className="divide-y divide-emerald-900/20">
							{filtered.map((payment) => {
								const amountNaira = payment.amount ? payment.amount / 100 : 0;
								const status = payment.status;
								return (
									<div key={payment.id} className="grid grid-cols-6 gap-2 px-3 py-3 text-xs md:text-sm items-center">
										<div className="truncate text-white">
											{payment.user?.name || "—"}
										</div>
										<div className="truncate text-muted-foreground">
											{payment.email || payment.user?.email || "—"}
										</div>
										<div className="text-white">
											{amountNaira > 0 ? formatNaira(amountNaira) : "—"}
										</div>
										<div>
											<Badge
												variant="outline"
												className={
													status === "SUCCESS"
														? "border-emerald-900/40 bg-emerald-900/10 text-emerald-300"
													: status === "FAILED"
														? "border-red-900/40 bg-red-900/10 text-red-300"
														: "border-amber-900/40 bg-amber-900/10 text-amber-300"
												}
											>
												{status}
											</Badge>
										</div>
										<div className="truncate text-muted-foreground">
											{payment.reference || "—"}
										</div>
										<div className="text-muted-foreground">
											{payment.createdAt
													? format(new Date(payment.createdAt), "MMM d, yyyy HH:mm")
													: "—"}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

