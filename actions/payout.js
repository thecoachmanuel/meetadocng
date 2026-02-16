"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { getSettings } from "@/lib/settings";

/**
 * Request payout for all remaining credits
 */
export async function requestPayout(formData) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new Error("Unauthorized");
  }

  const authUser = data.user;

  try {
    let doctor = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
      },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      const email = authUser.email || authUser.identities?.[0]?.email || "";
      if (email) {
        const byEmail = await db.user.findUnique({ where: { email } });
        if (byEmail?.role === "DOCTOR") {
          doctor = byEmail;
        }
      }
    }

    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("Doctor not found");
    }

    const bankName = formData.get("bankName");
    const accountName = formData.get("accountName");
    const accountNumber = formData.get("accountNumber");

    if (!bankName || !accountName || !accountNumber) {
      throw new Error("Bank name, account name, and account number are required");
    }

    // Check if doctor has any pending payout requests
    const existingPendingPayout = await db.payout.findFirst({
      where: {
        doctorId: doctor.id,
        status: "PROCESSING",
      },
    });

    if (existingPendingPayout) {
      throw new Error(
        "You already have a pending payout request. Please wait for it to be processed."
      );
    }

    // Get doctor's current credit balance
    const settings = await getSettings();
    const creditCount = doctor.credits;

    if (creditCount === 0) {
      throw new Error("No credits available for payout");
    }

    if (creditCount < 1) {
      throw new Error("Minimum 1 credit required for payout");
    }

    const totalAmount = creditCount * settings.creditToNairaRate;
    const adminPercentage = settings.adminEarningPercentage ?? 0;
    const platformFee = Math.round((totalAmount * adminPercentage) / 100);
    const netAmount = totalAmount - platformFee;

    // Create payout request
    const payout = await db.payout.create({
      data: {
        doctorId: doctor.id,
        amount: totalAmount,
        credits: creditCount,
        platformFee,
        netAmount,
        paypalEmail: authUser.email || doctor.email || "",
        bankName,
        accountName,
        accountNumber,
        status: "PROCESSING",
      },
    });

    revalidatePath("/doctor");
    return { success: true, payout };
  } catch (error) {
    console.error("Failed to request payout:", error);
    throw new Error("Failed to request payout: " + error.message);
  }
}

/**
 * Get doctor's payout history
 */
export async function getDoctorPayouts() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  const authUser = data?.user;

  if (error || !authUser) {
    throw new Error("Unauthorized");
  }

  try {
    let doctor = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
      },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      const email = authUser.email || authUser.identities?.[0]?.email || "";
      if (email) {
        const byEmail = await db.user.findUnique({ where: { email } });
        if (byEmail?.role === "DOCTOR") {
          doctor = byEmail;
        }
      }
    }

    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("Doctor not found");
    }

    const payouts = await db.payout.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { payouts };
  } catch (error) {
    throw new Error("Failed to fetch payouts: " + error.message);
  }
}

/**
 * Get doctor's earnings summary
 */
export async function getDoctorEarnings() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  const authUser = data?.user;

  if (error || !authUser) {
    throw new Error("Unauthorized");
  }

  try {
    let doctor = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
      },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      const email = authUser.email || authUser.identities?.[0]?.email || "";
      if (email) {
        const byEmail = await db.user.findUnique({ where: { email } });
        if (byEmail?.role === "DOCTOR") {
          doctor = byEmail;
        }
      }
    }

    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("Doctor not found");
    }

    const completedAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "COMPLETED",
        creditsReleased: true,
      },
    });

    const pendingAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        creditsReleased: false,
        lockedCredits: {
          gt: 0,
        },
        status: {
          in: ["SCHEDULED", "COMPLETED"],
        },
      },
    });

    // Calculate this month's completed appointments
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthAppointments = completedAppointments.filter(
      (appointment) => new Date(appointment.createdAt) >= currentMonth
    );

    const settings = await getSettings();
    const totalEarningsPoints = doctor.credits;

    const grossPerCredit = settings.creditToNairaRate;
    const adminPercentage = settings.adminEarningPercentage ?? 0;
    const netPerCredit = grossPerCredit * (1 - adminPercentage / 100);

    const totalEarningsNaira = doctor.credits * netPerCredit;

    const thisMonthEarningsPoints =
      thisMonthAppointments.length * settings.appointmentCreditCost;
    const thisMonthEarningsNaira = thisMonthEarningsPoints * netPerCredit;

    // Simple average per month calculation
    const averageEarningsPerMonth =
      totalEarningsNaira > 0
        ? totalEarningsNaira / Math.max(1, new Date().getMonth() + 1)
        : 0;

    const availableCredits = doctor.credits;
    const availablePayout = doctor.credits * netPerCredit;

    const pendingCredits = pendingAppointments.reduce(
      (sum, appointment) => sum + (appointment.lockedCredits || 0),
      0
    );
    const pendingPayout = pendingCredits * netPerCredit;

    return {
      earnings: {
        totalEarningsPoints,
        totalEarningsNaira,
        thisMonthEarningsPoints,
        thisMonthEarningsNaira,
        completedAppointments: completedAppointments.length,
        averageEarningsPerMonth,
        availableCredits,
        availablePayout,
        pendingCredits,
        pendingPayout,
      },
    };
  } catch (error) {
    throw new Error("Failed to fetch doctor earnings: " + error.message);
  }
}
