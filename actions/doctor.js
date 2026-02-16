"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { getSettings } from "@/lib/settings";

/**
 * Set doctor's availability slots
 */
export async function setAvailabilitySlots(formData) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new Error("Unauthorized");
  }

  const authUser = data.user;

  try {
    // Get the doctor
    const doctor = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const startTimeRaw = formData.get("startTime");
    const endTimeRaw = formData.get("endTime");

    if (!startTimeRaw || !endTimeRaw) {
      throw new Error("Start time and end time are required");
    }

    const startTime = new Date(startTimeRaw);
    const endTime = new Date(endTimeRaw);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new Error("Invalid start or end time");
    }

    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    // Create new availability slot (additive, supports multiple windows)
    const newSlot = await db.availability.create({
      data: {
        doctorId: doctor.id,
        startTime,
        endTime,
        status: "AVAILABLE",
      },
    });

    revalidatePath("/doctor");
    return { success: true, slot: newSlot };
  } catch (error) {
    console.error("Failed to set availability slots:", error);
    throw new Error("Failed to set availability: " + error.message);
  }
}

/**
 * Delete a single availability slot for the authenticated doctor
 */
export async function deleteAvailabilitySlot(formData) {
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

    const slotId = formData.get("slotId");

    if (!slotId) {
      throw new Error("Availability slot ID is required");
    }

    await db.availability.delete({
      where: {
        id: slotId,
      },
    });

    revalidatePath("/doctor");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete availability slot:", error);
    throw new Error("Failed to delete availability: " + error.message);
  }
}

/**
 * Get doctor's current availability slots
 */
export async function getDoctorAvailability() {
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

    const availabilitySlots = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { slots: availabilitySlots };
  } catch (error) {
    throw new Error("Failed to fetch availability slots " + error.message);
  }
}

/**
 * Get doctor's upcoming appointments
 */

export async function getDoctorAppointments() {
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

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: {
          in: ["SCHEDULED"],
        },
      },
      include: {
        patient: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { appointments };
  } catch (error) {
    throw new Error("Failed to fetch appointments " + error.message);
  }
}

/**
 * Cancel an appointment (can be done by both doctor and patient)
 */
export async function cancelAppointment(formData) {
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
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const appointmentId = formData.get("appointmentId");

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("You are not authorized to cancel this appointment");
    }

    const settings = await getSettings();

    await db.$transaction(async (tx) => {
      const current = await tx.appointment.findUnique({
        where: {
          id: appointmentId,
        },
      });

      if (!current) {
        throw new Error("Appointment not found");
      }

      if (current.status === "CANCELLED") {
        return;
      }

      let refundAmount = 0;
      let doctorAdjustment = 0;

      if (!current.creditsReleased) {
        if (current.lockedCredits && current.lockedCredits > 0) {
          refundAmount = current.lockedCredits;
          doctorAdjustment = 0;
        } else {
          refundAmount = settings.appointmentCreditCost;
          doctorAdjustment = settings.appointmentCreditCost;
        }

        if (refundAmount > 0) {
          await tx.creditTransaction.create({
            data: {
              userId: current.patientId,
              amount: refundAmount,
              type: "APPOINTMENT_DEDUCTION",
            },
          });

          await tx.user.update({
            where: {
              id: current.patientId,
            },
            data: {
              credits: {
                increment: refundAmount,
              },
            },
          });

          if (doctorAdjustment > 0) {
            await tx.creditTransaction.create({
              data: {
                userId: current.doctorId,
                amount: -doctorAdjustment,
                type: "APPOINTMENT_DEDUCTION",
              },
            });

            await tx.user.update({
              where: {
                id: current.doctorId,
              },
              data: {
                credits: {
                  decrement: doctorAdjustment,
                },
              },
            });
          }
        }
      }

      await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "CANCELLED",
          creditsReleased: true,
        },
      });
    });

    // Determine which path to revalidate based on user role
    if (user.role === "DOCTOR") {
      revalidatePath("/doctor");
    } else if (user.role === "PATIENT") {
      revalidatePath("/appointments");
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    throw new Error("Failed to cancel appointment: " + error.message);
  }
}

/**
 * Add notes to an appointment
 */
export async function addAppointmentNotes(formData) {
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

    const appointmentId = formData.get("appointmentId");
    const notes = formData.get("notes");

    if (!appointmentId || !notes) {
      throw new Error("Appointment ID and notes are required");
    }

    // Verify the appointment belongs to this doctor
    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Update the appointment notes
    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        notes,
      },
    });

    revalidatePath("/doctor");
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error("Failed to add appointment notes:", error);
    throw new Error("Failed to update notes: " + error.message);
  }
}

/**
 * Mark an appointment as completed (only by doctor after end time)
 */
export async function markAppointmentCompleted(formData) {
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

    const appointmentId = formData.get("appointmentId");

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found or not authorized");
    }

    if (appointment.status !== "SCHEDULED") {
      throw new Error("Only scheduled appointments can be marked as completed");
    }

    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      throw new Error(
        "Cannot mark appointment as completed before the scheduled end time"
      );
    }

    const settings = await getSettings();

    const updatedAppointment = await db.$transaction(async (tx) => {
      const current = await tx.appointment.findUnique({
        where: {
          id: appointmentId,
        },
      });

      if (!current) {
        throw new Error("Appointment not found or not authorized");
      }

      if (current.status !== "SCHEDULED") {
        throw new Error("Only scheduled appointments can be marked as completed");
      }

      let payoutCredits = 0;
      let creditsReleased = current.creditsReleased;

      if (!current.creditsReleased && current.lockedCredits && current.lockedCredits > 0) {
        payoutCredits = current.lockedCredits;

        await tx.creditTransaction.create({
          data: {
            userId: current.doctorId,
            amount: payoutCredits,
            type: "APPOINTMENT_DEDUCTION",
          },
        });

        await tx.user.update({
          where: {
            id: current.doctorId,
          },
          data: {
            credits: {
              increment: payoutCredits,
            },
          },
        });

        creditsReleased = true;
      }

      const updated = await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "COMPLETED",
          creditsReleased,
        },
      });

      return updated;
    });

    revalidatePath("/doctor");
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error("Failed to mark appointment as completed:", error);
    throw new Error(
      "Failed to mark appointment as completed: " + error.message
    );
  }
}
