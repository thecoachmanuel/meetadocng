"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * Verifies if current user has admin role
 */
export async function verifyAdmin() {
  const supabase = await supabaseServer();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return false;
  }

  try {
    let dbUser = await db.user.findUnique({
      where: {
        clerkUserId: authUser.id,
      },
    });

    if (!dbUser) {
      const email = authUser.email || authUser.identities?.[0]?.email || "";
      if (email) {
        const byEmail = await db.user.findUnique({ where: { email } });
        if (byEmail) {
          await db.user.update({ where: { email }, data: { clerkUserId: authUser.id } });
          dbUser = await db.user.findUnique({ where: { clerkUserId: authUser.id } });
        }
      }
    }

    return dbUser?.role === "ADMIN";
  } catch (error) {
    console.error("Failed to verify admin:", error);
    return false;
  }
}

/**
 * Gets all doctors with pending verification
 */
export async function getPendingDoctors() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const pendingDoctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { doctors: pendingDoctors };
  } catch (error) {
    throw new Error("Failed to fetch pending doctors");
  }
}

/**
 * Gets all verified doctors
 */
export async function getVerifiedDoctors() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const verifiedDoctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
      orderBy: {
        name: "asc",
      },
    });

    return { doctors: verifiedDoctors };
  } catch (error) {
    console.error("Failed to get verified doctors:", error);
    return { error: "Failed to fetch verified doctors" };
  }
}

export async function getNewUsers() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return { users };
}

export async function getLeaderboards() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const topPatients = await db.user.findMany({
    where: { role: "PATIENT" },
    orderBy: { credits: "desc" },
    take: 10,
    select: { id: true, name: true, email: true, credits: true },
  });
  const topDoctors = await db.user.findMany({
    where: { role: "DOCTOR" },
    orderBy: { credits: "desc" },
    take: 10,
    select: { id: true, name: true, email: true, credits: true, specialty: true },
  });
  return { patients: topPatients, doctors: topDoctors };
}

export async function getAnalytics() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const usersMonthlyCallsRaw = await db.appointment.groupBy({
    by: ["patientId"],
    where: { status: "COMPLETED", createdAt: { gte: startMonth } },
    _count: { _all: true },
  });
  const usersAllTimeCallsRaw = await db.appointment.groupBy({
    by: ["patientId"],
    where: { status: "COMPLETED" },
    _count: { _all: true },
  });
  const doctorsMonthlyEarningsRaw = await db.appointment.groupBy({
    by: ["doctorId"],
    where: { status: "COMPLETED", createdAt: { gte: startMonth } },
    _count: { _all: true },
  });
  const doctorsAllTimeEarningsRaw = await db.appointment.groupBy({
    by: ["doctorId"],
    where: { status: "COMPLETED" },
    _count: { _all: true },
  });

  const settings = await (await import("@/lib/settings")).getSettings();

  const usersMonthlyCalls = (
    await Promise.all(
      usersMonthlyCallsRaw.map(async (row) => {
        const u = await db.user.findUnique({ where: { id: row.patientId } });
        if (!u) return null;
        return { id: u.id, name: u.name, email: u.email, calls: row._count._all };
      })
    )
  ).filter(Boolean);

  const usersAllTimeCalls = (
    await Promise.all(
      usersAllTimeCallsRaw.map(async (row) => {
        const u = await db.user.findUnique({ where: { id: row.patientId } });
        if (!u) return null;
        return { id: u.id, name: u.name, email: u.email, calls: row._count._all };
      })
    )
  ).filter(Boolean);

  const doctorsMonthlyEarnings = (
    await Promise.all(
      doctorsMonthlyEarningsRaw.map(async (row) => {
        const d = await db.user.findUnique({ where: { id: row.doctorId } });
        if (!d) return null;
        const points = row._count._all * settings.appointmentCreditCost;
        const naira =
          points * settings.doctorEarningPerCredit * settings.creditToNairaRate;
        return { id: d.id, name: d.name, email: d.email, points, naira };
      })
    )
  ).filter(Boolean);

  const doctorsAllTimeEarnings = (
    await Promise.all(
      doctorsAllTimeEarningsRaw.map(async (row) => {
        const d = await db.user.findUnique({ where: { id: row.doctorId } });
        if (!d) return null;
        const points = row._count._all * settings.appointmentCreditCost;
        const naira =
          points * settings.doctorEarningPerCredit * settings.creditToNairaRate;
        return { id: d.id, name: d.name, email: d.email, points, naira };
      })
    )
  ).filter(Boolean);

  return {
    usersMonthlyCalls,
    usersAllTimeCalls,
    doctorsMonthlyEarnings,
    doctorsAllTimeEarnings,
  };
}

/**
 * Updates a doctor's verification status
 */
export async function updateDoctorStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const status = formData.get("status");

  if (!doctorId || !["VERIFIED", "REJECTED"].includes(status)) {
    throw new Error("Invalid input");
  }

  try {
    await db.user.update({
      where: {
        id: doctorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update doctor status:", error);
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}

/**
 * Suspends or reinstates a doctor
 */
export async function updateDoctorActiveStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const suspend = formData.get("suspend") === "true";

  if (!doctorId) {
    throw new Error("Doctor ID is required");
  }

  try {
    const status = suspend ? "PENDING" : "VERIFIED";

    await db.user.update({
      where: {
        id: doctorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update doctor active status:", error);
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}

/**
 * Gets all pending payouts that need admin approval
 */
export async function getPendingPayouts() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const pendingPayouts = await db.payout.findMany({
      where: {
        status: "PROCESSING",
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
            credits: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { payouts: pendingPayouts };
  } catch (error) {
    console.error("Failed to fetch pending payouts:", error);
    throw new Error("Failed to fetch pending payouts");
  }
}

/**
 * Approves a payout request and deducts credits from doctor's account
 */
export async function approvePayout(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const payoutId = formData.get("payoutId");

  if (!payoutId) {
    throw new Error("Payout ID is required");
  }

  try {
    const supabase = await supabaseServer();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    let admin = await db.user.findUnique({ where: { clerkUserId: authUser?.id || "" } });
    if (!admin) {
      const email = authUser?.email || authUser?.identities?.[0]?.email || "";
      if (email) {
        const byEmail = await db.user.findUnique({ where: { email } });
        if (byEmail) {
          await db.user.update({ where: { email }, data: { clerkUserId: authUser.id } });
          admin = await db.user.findUnique({ where: { clerkUserId: authUser.id } });
        }
      }
    }

    // Find the payout request
    const payout = await db.payout.findUnique({
      where: {
        id: payoutId,
        status: "PROCESSING",
      },
      include: {
        doctor: true,
      },
    });

    if (!payout) {
      throw new Error("Payout request not found or already processed");
    }

    // Check if doctor has enough credits
    if (payout.doctor.credits < payout.credits) {
      throw new Error("Doctor doesn't have enough credits for this payout");
    }

    // Process the payout in a transaction
    await db.$transaction(async (tx) => {
      // Update payout status to PROCESSED
      await tx.payout.update({
        where: {
          id: payoutId,
        },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          processedBy: admin?.id || "unknown",
        },
      });

      // Deduct credits from doctor's account
      await tx.user.update({
        where: {
          id: payout.doctorId,
        },
        data: {
          credits: {
            decrement: payout.credits,
          },
        },
      });

      // Create a transaction record for the deduction
      await tx.creditTransaction.create({
        data: {
          userId: payout.doctorId,
          amount: -payout.credits,
          type: "ADMIN_ADJUSTMENT",
        },
      });
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve payout:", error);
    throw new Error(`Failed to approve payout: ${error.message}`);
  }
}
