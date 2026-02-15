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
    const user = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
        role: "PATIENT",
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new Error("Patient not found");
    }

    const appointments = await db.appointment.findMany({
      where: {
        patientId: user.id,
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
        startTime: "desc",
      },
    });

    return { appointments };
  } catch (error) {
    console.error("Failed to get patient appointments:", error);
    return { error: "Failed to fetch appointments" };
  }
}
