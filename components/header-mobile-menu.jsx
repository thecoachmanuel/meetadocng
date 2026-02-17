"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Menu, ShieldCheck, Stethoscope, User } from "lucide-react";
import AvatarToggleLink from "@/components/avatar-toggle-link";
import NotificationsBell from "@/components/notifications-bell";

export function HeaderMobileMenu({ user, notifications, doctorAvailableCredits }) {
	const [open, setOpen] = useState(false);
	const toggle = () => setOpen((prev) => !prev);
	const close = () => setOpen(false);
	const creditsLabel = () => {
		if (!user || user.role === "ADMIN") return "Pricing";
		const value = user.role === "DOCTOR" && doctorAvailableCredits !== null ? doctorAvailableCredits : user.credits ?? 0;
		const suffix = user.role === "PATIENT" ? "Credits" : "Earned Credits";
		return `${value} ${suffix}`;
	};
	const primaryTarget = !user || user.role === "ADMIN" ? "/pricing" : user.role === "PATIENT" ? "/pricing" : "/doctor";
	return (
		<div className="flex items-center gap-2 md:hidden">
			{user && (
				<NotificationsBell
					initialItems={notifications.items}
					initialUnreadCount={notifications.unreadCount}
				/>
			)}
			<div className="relative">
				<Button type="button" variant="ghost" className="w-10 h-10 p-0" onClick={toggle} aria-expanded={open} aria-label="Toggle navigation">
					<Menu className="h-5 w-5" />
				</Button>
				<div
					className={`absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-lg border border-emerald-900/30 bg-background/95 backdrop-blur-sm shadow-lg z-30 origin-top-right transition-all duration-200 ease-out ${open ? "opacity-100 scale-100 translate-y-0" : "pointer-events-none opacity-0 scale-95 -translate-y-1"}`}
				>
					<div className="flex flex-col p-2 space-y-1">
						{user && user.role === "ADMIN" && (
							<Link href="/admin" onClick={close}>
								<Button variant="ghost" className="w-full justify-start gap-2">
									<ShieldCheck className="h-4 w-4" />
									<span>Admin Dashboard</span>
								</Button>
							</Link>
						)}
						{user && user.role === "DOCTOR" && (
							<Link href="/doctor" onClick={close}>
								<Button variant="ghost" className="w-full justify-start gap-2">
									<Stethoscope className="h-4 w-4" />
									<span>Doctor Dashboard</span>
								</Button>
							</Link>
						)}
						{user && user.role === "PATIENT" && (
							<Link href="/appointments" onClick={close}>
								<Button variant="ghost" className="w-full justify-start gap-2">
									<Calendar className="h-4 w-4" />
									<span>My Appointments</span>
								</Button>
							</Link>
						)}
						{user && user.role === "UNASSIGNED" && (
							<Link href="/onboarding" onClick={close}>
								<Button variant="ghost" className="w-full justify-start gap-2">
									<User className="h-4 w-4" />
									<span>Complete Profile</span>
								</Button>
							</Link>
						)}
						{(!user || user.role !== "ADMIN") && (
							<Link href={primaryTarget} onClick={close}>
								<Button variant="ghost" className="w-full justify-start gap-2">
									<CreditCard className="h-4 w-4" />
									<span>{creditsLabel()}</span>
								</Button>
							</Link>
						)}
						{!user && (
							<Link href="/sign-in" onClick={close}>
								<Button variant="default" className="w-full justify-center">
									Sign In
								</Button>
							</Link>
						)}
						{user && (
							<div className="flex items-center justify-between pt-1 gap-2">
								<AvatarToggleLink
									src={user.imageUrl || ""}
									alt={user.name || "Account"}
									size={32}
									className="mr-2"
								/>
							</div>
						)}
					</div>
				</div>
		</div>
	);
}

