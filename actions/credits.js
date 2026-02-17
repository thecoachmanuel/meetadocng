"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

// Define credit allocations per plan
import { getSettings } from "@/lib/settings";

/**
 * Checks user's subscription and allocates monthly credits if needed
 * This should be called on app initialization (e.g., in a layout component)
 */
export async function checkAndAllocateCredits(user) {
  try {
    if (!user) {
      return null;
    }

    if (user.role !== "PATIENT") {
      return user;
    }

    const currentMonth = format(new Date(), "yyyy-MM");

    if (user.transactions.length > 0) {
      const latestTransaction = user.transactions[0];
      const transactionMonth = format(
        new Date(latestTransaction.createdAt),
        "yyyy-MM"
      );

      if (transactionMonth === currentMonth) {
        return user;
      }
    }

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Deducts credits for booking an appointment
 */
export async function deductCreditsForAppointment(userId, doctorId) {
  try {
    const settings = await getSettings();
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits < settings.appointmentCreditCost) {
      const missing = settings.appointmentCreditCost - user.credits;
      throw new Error(
        `You do not have enough credits to book this appointment. You have ${user.credits} credit${
          user.credits === 1 ? "" : "s"
        } and this appointment costs ${settings.appointmentCreditCost} credits. You need ${missing} more credit${
          missing === 1 ? "" : "s"
        }. Please purchase more credits on the Pricing page.`,
      );
    }

    const result = await db.$transaction(async (tx) => {
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -settings.appointmentCreditCost,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          credits: {
            decrement: settings.appointmentCreditCost,
          },
        },
      });

      return {
        user: updatedUser,
        cost: settings.appointmentCreditCost,
      };
    });

    return { success: true, user: result.user, cost: result.cost };
  } catch (error) {
    console.error("Failed to deduct credits:", error);
    return { success: false, error: error.message };
  }
}

export async function purchaseCredits(userId, plan) {
  try {
    const settings = await getSettings();
    const creditsMap = {
      free_user: settings.freeCredits,
      standard: settings.standardCredits,
      premium: settings.premiumCredits,
    };
    const creditsToAllocate = creditsMap[plan] ?? 0;

    const updatedUser = await db.$transaction(async (tx) => {
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: creditsToAllocate,
          type: "CREDIT_PURCHASE",
          packageId: plan,
        },
      });

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: creditsToAllocate },
        },
      });

      return updated;
    });

    revalidatePath("/doctors");
    revalidatePath("/appointments");

    return { success: true, user: updatedUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
