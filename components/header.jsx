import React from "react";
import { Button } from "./ui/button";
import {
	Calendar,
	CreditCard,
	ShieldCheck,
	Stethoscope,
	User,
	Menu,
} from "lucide-react";
import Link from "next/link";
import SignOutButton from "./sign-out-button";
import { checkUser } from "@/lib/checkUser";
import { Badge } from "./ui/badge";
import { checkAndAllocateCredits } from "@/actions/credits";
import Image from "next/image";
import AvatarToggleLink from "@/components/avatar-toggle-link";
import { supabaseServer } from "@/lib/supabase-server";
import { getSettings } from "@/lib/settings";
import { getDoctorEarnings } from "@/actions/payout";
import NotificationsBell from "@/components/notifications-bell";
import { getUserNotifications } from "@/actions/notifications";

export default async function Header() {
  const [user, settings] = await Promise.all([checkUser(), getSettings()]);

  let doctorAvailableCredits = null;
  if (user?.role === "DOCTOR") {
    try {
      const earningsData = await getDoctorEarnings();
      doctorAvailableCredits = earningsData?.earnings?.availableCredits ?? null;
    } catch {}
  }
  if (user?.role === "PATIENT") {
    await checkAndAllocateCredits(user);
  }

  let notifications = { items: [], unreadCount: 0 };
  if (user) {
    try {
      notifications = await getUserNotifications();
    } catch {}
  }

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-20 supports-backdrop-filter:bg-background/60">
			<nav className="container mx-auto px-4 h-16 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2 cursor-pointer">
					<Image
						src={settings.logoUrl || "/logo-single.png"}
						alt={settings.siteTitle || "MeetADoc"}
						width={200}
						height={60}
						className="h-10 w-auto object-contain"
					/>
				</Link>
				{/* Desktop actions */}
				<div className="hidden md:flex items-center space-x-2">
					{user && (
						<NotificationsBell
							initialItems={notifications.items}
							initialUnreadCount={notifications.unreadCount}
						/>
					)}
					{user && (
						<>
							{user?.role === "ADMIN" && (
								<Link href="/admin">
									<Button
										variant="outline"
										className="inline-flex items-center gap-2"
									>
										<ShieldCheck className="h-4 w-4" />
										Admin Dashboard
									</Button>
								</Link>
							)}
							{user?.role === "DOCTOR" && (
								<Link href="/doctor">
									<Button
										variant="outline"
										className="inline-flex items-center gap-2"
									>
										<Stethoscope className="h-4 w-4" />
										Doctor Dashboard
									</Button>
								</Link>
							)}
							{user?.role === "PATIENT" && (
								<Link href="/appointments">
									<Button
										variant="outline"
										className="inline-flex items-center gap-2"
									>
										<Calendar className="h-4 w-4" />
										My Appointments
									</Button>
								</Link>
							)}
							{user?.role === "UNASSIGNED" && (
								<Link href="/onboarding">
									<Button
										variant="outline"
										className="inline-flex items-center gap-2"
									>
										<User className="h-4 w-4" />
										Complete Profile
									</Button>
								</Link>
							)}
						</>
					)}
					{(!user || user?.role !== "ADMIN") && (
						<Link href={user?.role === "PATIENT" ? "/pricing" : "/doctor"}>
							<Badge
								variant="outline"
								className="h-9 bg-emerald-900/20 border-emerald-700/30 px-3 py-1 flex items-center gap-2"
							>
								<CreditCard className="h-3.5 w-3.5 text-emerald-400" />
								<span className="text-emerald-400">
									{user && user.role !== "ADMIN" ? (
										<>
											{user.role === "DOCTOR" && doctorAvailableCredits !== null
													? doctorAvailableCredits
													: user.credits}{" "}
											<span>
												{user?.role === "PATIENT"
													? "Credits"
													: "Earned Credits"}
											</span>
										</>
									) : (
										<>Pricing</>
									)}
								</span>
							</Badge>
						</Link>
					)}
					{!user && (
						<Link href="/sign-in">
							<Button variant="secondary">Sign In</Button>
						</Link>
					)}
					{user && (
						<>
							<AvatarToggleLink
								src={user.imageUrl || ""}
								alt={user.name || "Account"}
								size={36}
								className="ml-2"
							/>
							<SignOutButton />
						</>
					)}
				</div>
				{/* Mobile actions */}
				<div className="flex items-center gap-2 md:hidden">
					{user && (
						<NotificationsBell
							initialItems={notifications.items}
							initialUnreadCount={notifications.unreadCount}
						/>
					)}
					<details className="relative">
						<summary className="list-none">
							<Button type="button" variant="ghost" className="w-10 h-10 p-0">
								<Menu className="h-5 w-5" />
							</Button>
						</summary>
						<div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-lg border border-emerald-900/30 bg-background/95 backdrop-blur-sm shadow-lg z-30">
							<div className="flex flex-col p-2 space-y-1">
								{user && user.role === "ADMIN" && (
									<Link href="/admin">
										<Button variant="ghost" className="w-full justify-start gap-2">
											<ShieldCheck className="h-4 w-4" />
											<span>Admin Dashboard</span>
										</Button>
									</Link>
								)}
								{user && user.role === "DOCTOR" && (
									<Link href="/doctor">
										<Button variant="ghost" className="w-full justify-start gap-2">
											<Stethoscope className="h-4 w-4" />
											<span>Doctor Dashboard</span>
										</Button>
									</Link>
								)}
								{user && user.role === "PATIENT" && (
									<Link href="/appointments">
										<Button variant="ghost" className="w-full justify-start gap-2">
											<Calendar className="h-4 w-4" />
											<span>My Appointments</span>
										</Button>
									</Link>
								)}
								{user && user.role === "UNASSIGNED" && (
									<Link href="/onboarding">
										<Button variant="ghost" className="w-full justify-start gap-2">
											<User className="h-4 w-4" />
											<span>Complete Profile</span>
										</Button>
									</Link>
								)}
								{(!user || user.role !== "ADMIN") && (
									<Link href={user?.role === "PATIENT" ? "/pricing" : "/doctor"}>
										<Button variant="ghost" className="w-full justify-start gap-2">
											<CreditCard className="h-4 w-4" />
											<span>
												{user && user.role !== "ADMIN"
													? `${user.role === "DOCTOR" && doctorAvailableCredits !== null ? doctorAvailableCredits : user?.credits ?? 0} ${user.role === "PATIENT" ? "Credits" : "Earned Credits"}`
													: "Pricing"}
											</span>
										</Button>
									</Link>
								)}
								{!user && (
									<Link href="/sign-in">
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
										<SignOutButton />
									</div>
								)}
							</div>
						</div>
					</details>
				</div>
			</nav>
    </header>
  );
}
