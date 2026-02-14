"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { getSettings } from "@/lib/settings";

const CREDIT_VALUE = 10; // $10 per credit total
const PLATFORM_FEE_PER_CREDIT = 2; // $2 platform fee
const DOCTOR_EARNINGS_PER_CREDIT = 8; // $8 to doctor

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
    const doctor = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
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
    const platformFee = 0;
    const netAmount = creditCount * settings.doctorEarningPerCredit * settings.creditToNairaRate;

    // Create payout request
    const payout = await db.payout.create({
      data: {
        doctorId: doctor.id,
        amount: totalAmount,
        credits: creditCount,
        platformFee,
        netAmount,
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
    const doctor = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
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
    const doctor = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Get all completed appointments for this doctor
    const completedAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "COMPLETED",
      },
    });

    // Calculate this month's completed appointments
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthAppointments = completedAppointments.filter(
      (appointment) => new Date(appointment.createdAt) >= currentMonth
    );

    // Use doctor's actual credits from the user model
    const settings = await getSettings();
    const totalEarningsPoints = doctor.credits;
    const totalEarningsNaira = doctor.credits * settings.doctorEarningPerCredit * settings.creditToNairaRate;

    // Calculate this month's earnings (2 credits per appointment * $8 per credit)
    const thisMonthEarningsPoints = thisMonthAppointments.length * settings.appointmentCreditCost;
    const thisMonthEarningsNaira = thisMonthEarningsPoints * settings.doctorEarningPerCredit * settings.creditToNairaRate;

    // Simple average per month calculation
    const averageEarningsPerMonth =
      totalEarningsNaira > 0
        ? totalEarningsNaira / Math.max(1, new Date().getMonth() + 1)
        : 0;

    // Get current credit balance for payout calculations
    const availableCredits = doctor.credits;
    const availablePayout = doctor.credits * settings.doctorEarningPerCredit * settings.creditToNairaRate;

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
      },
    };
  } catch (error) {
    throw new Error("Failed to fetch doctor earnings: " + error.message);
  }
}
