import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Get all appointments for the authenticated patient
 */
export async function getPatientAppointments() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new Error("Unauthorized");
  }

  const authUser = data.user;

  try {
    let user = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user || user.role !== "PATIENT") {
      const email = authUser.email || authUser.identities?.[0]?.email || "";
      if (email) {
        const byEmail = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            role: true,
          },
        });
        if (byEmail?.role === "PATIENT") {
          user = byEmail;
        }
      }
    }

    if (!user || user.role !== "PATIENT") {
      throw new Error("Patient not found");
    }

    const now = new Date();

    const appointments = await db.appointment.findMany({
      where: {
        patientId: user.id,
        status: "SCHEDULED",
        endTime: {
          gte: now,
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { appointments };
  } catch (error) {
    console.error("Failed to get patient appointments:", error);
    return { error: "Failed to fetch appointments" };
  }
}
