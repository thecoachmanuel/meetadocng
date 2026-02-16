"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * Verifies if current user has admin role
 */
export async function verifyAdmin() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return false;
  }

  const authUser = data.user;

  try {
    let dbUser = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
      },
    });

    if (!dbUser) {
      const email = authUser.email || authUser.identities?.[0]?.email || "";
      if (email) {
        dbUser = await db.user.findUnique({ where: { email } });
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

  try {
    const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
    return { users };
  } catch (error) {
    console.error("Failed to get new users:", error);
    return { users: [] };
  }
}

export async function getLeaderboards() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
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
  } catch (error) {
    console.error("Failed to get leaderboards:", error);
    return { patients: [], doctors: [] };
  }
}

export async function getAnalytics() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
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

    const adminResolutionsRaw = await db.appointment.findMany({
      where: {
        adminResolutionNote: {
          not: null,
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    });

    const settings = await (await import("@/lib/settings")).getSettings();

    const payoutsThisMonth = await db.payout.findMany({
      where: {
        status: "PROCESSED",
        createdAt: {
          gte: startMonth,
        },
      },
    });

    const payoutsAllTime = await db.payout.findMany({
      where: {
        status: "PROCESSED",
      },
    });

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
          const grossPerCredit = settings.creditToNairaRate;
          const adminPercentage = settings.adminEarningPercentage ?? 0;
          const netPerCredit = grossPerCredit * (1 - adminPercentage / 100);
          const naira = points * netPerCredit;
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
          const grossPerCredit = settings.creditToNairaRate;
          const adminPercentage = settings.adminEarningPercentage ?? 0;
          const netPerCredit = grossPerCredit * (1 - adminPercentage / 100);
          const naira = points * netPerCredit;
          return { id: d.id, name: d.name, email: d.email, points, naira };
        })
      )
    ).filter(Boolean);

    const adminResolutions = adminResolutionsRaw.map((appt) => ({
      id: appt.id,
      doctor: appt.doctor,
      patient: appt.patient,
      status: appt.status,
      decision: appt.status === "CANCELLED" ? "REFUNDED" : "RELEASED",
      note: appt.adminResolutionNote,
      updatedAt: appt.updatedAt,
    }));

    const totalPlatformFeesThisMonth = payoutsThisMonth.reduce(
      (sum, payout) => sum + (payout.platformFee || 0),
      0
    );

    const totalPlatformFeesAllTime = payoutsAllTime.reduce(
      (sum, payout) => sum + (payout.platformFee || 0),
      0
    );

    const platformFeesTimelineMap = new Map();

    payoutsAllTime.forEach((payout) => {
      const date = payout.createdAt;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = platformFeesTimelineMap.get(key) || {
        month: key,
        platformFee: 0,
        grossAmount: 0,
        netAmount: 0,
      };
      existing.platformFee += payout.platformFee || 0;
      existing.grossAmount += payout.amount || 0;
      existing.netAmount += payout.netAmount || 0;
      platformFeesTimelineMap.set(key, existing);
    });

    const platformFeesTimeline = Array.from(platformFeesTimelineMap.values()).sort(
      (a, b) => a.month.localeCompare(b.month)
    ).slice(-6);

    return {
      usersMonthlyCalls,
      usersAllTimeCalls,
      doctorsMonthlyEarnings,
      doctorsAllTimeEarnings,
      adminResolutions,
      platformFees: {
        totalThisMonth: totalPlatformFeesThisMonth,
        totalAllTime: totalPlatformFeesAllTime,
        timeline: platformFeesTimeline,
      },
    };
  } catch (error) {
    console.error("Failed to get analytics:", error);
    return {
      usersMonthlyCalls: [],
      usersAllTimeCalls: [],
      doctorsMonthlyEarnings: [],
      doctorsAllTimeEarnings: [],
      adminResolutions: [],
      platformFees: {
        totalThisMonth: 0,
        totalAllTime: 0,
        timeline: [],
      },
    };
  }
}

export async function adminAdjustUserCredits(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const rawEmail = formData.get("email");
  const rawCredits = formData.get("credits");
  const mode = formData.get("mode") || "gift";

  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const credits = Number(rawCredits || 0);

  if (!email) {
    throw new Error("User email is required");
  }

  if (!Number.isFinite(credits) || credits <= 0) {
    throw new Error("Credits must be a positive number");
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("User not found");
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        credits: {
          increment: credits,
        },
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId: user.id,
        amount: credits,
        type: mode === "sale" ? "CREDIT_PURCHASE" : "ADMIN_ADJUSTMENT",
      },
    });
  });

  revalidatePath("/admin");

  return { success: true };
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
    const { data, error } = await supabase.auth.getUser();
    const authUser = data?.user;
    let admin = await db.user.findUnique({ where: { supabaseUserId: authUser?.id || "" } });
    if (!admin) {
      const email = authUser?.email || authUser?.identities?.[0]?.email || "";
      if (email) {
        const byEmail = await db.user.findUnique({ where: { email } });
        if (byEmail) {
          await db.user.update({ where: { email }, data: { supabaseUserId: authUser.id } });
          admin = await db.user.findUnique({ where: { supabaseUserId: authUser.id } });
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

export async function getDoctorEscrowDecisions(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");

  if (!doctorId) {
    throw new Error("Doctor ID is required");
  }

  try {
    const appointments = await db.appointment.findMany({
      where: {
        doctorId,
        adminResolutionNote: {
          not: null,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    });

    const decisions = appointments.map((appt) => ({
      id: appt.id,
      status: appt.status,
      decision: appt.status === "CANCELLED" ? "REFUNDED" : "RELEASED",
      note: appt.adminResolutionNote,
      updatedAt: appt.updatedAt,
      lockedCredits: appt.lockedCredits,
      patient: appt.patient,
    }));

    return { decisions };
  } catch (error) {
    console.error("Failed to fetch doctor escrow decisions:", error);
    throw new Error("Failed to fetch doctor escrow decisions");
  }
}

export async function getEscrowAppointments() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const appointments = await db.appointment.findMany({
      where: {
        lockedCredits: {
          gt: 0,
        },
        creditsReleased: false,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { appointments };
  } catch (error) {
    console.error("Failed to fetch escrow appointments:", error);
    throw new Error("Failed to fetch escrow appointments");
  }
}

export async function releaseAppointmentCredits(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const appointmentId = formData.get("appointmentId");
  const note = formData.get("note");

  if (!appointmentId) {
    throw new Error("Appointment ID is required");
  }

  try {
    await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: {
          id: appointmentId,
        },
      });

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      if (appointment.creditsReleased) {
        return;
      }

      if (!appointment.lockedCredits || appointment.lockedCredits <= 0) {
        throw new Error("No locked credits to release for this appointment");
      }

      if (appointment.status === "CANCELLED") {
        throw new Error("Cannot release credits for a cancelled appointment");
      }

      const payoutCredits = appointment.lockedCredits;

      await tx.creditTransaction.create({
        data: {
          userId: appointment.doctorId,
          amount: payoutCredits,
          type: "ADMIN_ADJUSTMENT",
        },
      });

      await tx.user.update({
        where: {
          id: appointment.doctorId,
        },
        data: {
          credits: {
            increment: payoutCredits,
          },
        },
      });

      await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: appointment.status === "SCHEDULED" ? "COMPLETED" : appointment.status,
          creditsReleased: true,
          adminResolutionNote: note || appointment.adminResolutionNote,
        },
      });
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to release appointment credits:", error);
    throw new Error(`Failed to release appointment credits: ${error.message}`);
  }
}

export async function refundAppointmentCredits(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const appointmentId = formData.get("appointmentId");
  const note = formData.get("note");

  if (!appointmentId) {
    throw new Error("Appointment ID is required");
  }

  try {
    await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: {
          id: appointmentId,
        },
      });

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      if (appointment.creditsReleased) {
        throw new Error("Credits already released for this appointment");
      }

      if (!appointment.lockedCredits || appointment.lockedCredits <= 0) {
        throw new Error("No locked credits to refund for this appointment");
      }

      const refundAmount = appointment.lockedCredits;

      await tx.creditTransaction.create({
        data: {
          userId: appointment.patientId,
          amount: refundAmount,
          type: "ADMIN_ADJUSTMENT",
        },
      });

      await tx.user.update({
        where: {
          id: appointment.patientId,
        },
        data: {
          credits: {
            increment: refundAmount,
          },
        },
      });

      await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "CANCELLED",
          creditsReleased: true,
          adminResolutionNote: note || appointment.adminResolutionNote,
        },
      });
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to refund appointment credits:", error);
    throw new Error(`Failed to refund appointment credits: ${error.message}`);
  }
}
