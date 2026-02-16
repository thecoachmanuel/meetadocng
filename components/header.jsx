import React from "react";
import { Button } from "./ui/button";
import {
  Calendar,
  CreditCard,
  ShieldCheck,
  Stethoscope,
  User,
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

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-backdrop-filter:bg-background/60">
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

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {user && (
            <>
              {/* Admin Links */}
              {user?.role === "ADMIN" && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    className="hidden md:inline-flex items-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin Dashboard
                  </Button>
                  <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                    <ShieldCheck className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {/* Doctor Links */}
              {user?.role === "DOCTOR" && (
                <Link href="/doctor">
                  <Button
                    variant="outline"
                    className="hidden md:inline-flex items-center gap-2"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Doctor Dashboard
                  </Button>
                  <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                    <Stethoscope className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {/* Patient Links */}
              {user?.role === "PATIENT" && (
                <Link href="/appointments">
                  <Button
                    variant="outline"
                    className="hidden md:inline-flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    My Appointments
                  </Button>
                  <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {/* Unassigned Role */}
              {user?.role === "UNASSIGNED" && (
                <Link href="/onboarding">
                  <Button
                    variant="outline"
                    className="hidden md:inline-flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Complete Profile
                  </Button>
                  <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                    <User className="h-4 w-4" />
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
                      <span className="hidden md:inline">
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
      </nav>
    </header>
  );
}
