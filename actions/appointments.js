"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { deductCreditsForAppointment } from "@/actions/credits";
import { addDays, addMinutes, format, isBefore, endOfDay } from "date-fns";

async function ensureStreamCall(callId, createdById) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const secret = process.env.STREAM_SECRET_KEY;
  if (!apiKey || !secret) {
    return callId;
  }
  try {
    const { StreamClient } = await import("@stream-io/node-sdk");
    const client = new StreamClient({ apiKey, secret });
    await client.video
      .call("default", callId)
      .getOrCreate({ created_by_id: createdById });
  } catch {}
  return callId;
}

/**
 * Book a new appointment with a doctor
 */
export async function bookAppointment(formData) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new Error("Unauthorized");
  }

  const authUser = data.user;

  try {
    // Get the patient user, with fallback to email for legacy records
    let patient = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
      },
    });

    if (!patient || patient.role !== "PATIENT") {
      const email = authUser.email || authUser.identities?.[0]?.email || "";
      if (email) {
        const byEmail = await db.user.findUnique({ where: { email } });
        if (byEmail?.role === "PATIENT") {
          patient = byEmail;
        }
      }
    }

    if (!patient || patient.role !== "PATIENT") {
      throw new Error("Patient not found");
    }

    // Parse form data
    const doctorId = formData.get("doctorId");
    const startTimeMs = formData.get("startTimeMs");
    const endTimeMs = formData.get("endTimeMs");
    const startTime = startTimeMs ? new Date(Number(startTimeMs)) : new Date(formData.get("startTime"));
    const endTime = endTimeMs ? new Date(Number(endTimeMs)) : new Date(formData.get("endTime"));
    const patientDescription = formData.get("description") || null;

    // Validate input
    if (!doctorId || !startTime || !endTime) {
      throw new Error("Doctor, start time, and end time are required");
    }

    // Check if the doctor exists and is verified
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found or not verified");
    }

    // Check if the requested time slot is available
    const overlappingAppointment = await db.appointment.findFirst({
      where: {
        doctorId: doctorId,
        status: "SCHEDULED",
        OR: [
          {
            // New appointment starts during an existing appointment
            startTime: {
              lte: startTime,
            },
            endTime: {
              gt: startTime,
            },
          },
          {
            // New appointment ends during an existing appointment
            startTime: {
              lt: endTime,
            },
            endTime: {
              gte: endTime,
            },
          },
          {
            // New appointment completely overlaps an existing appointment
            startTime: {
              gte: startTime,
            },
            endTime: {
              lte: endTime,
            },
          },
        ],
      },
    });

    if (overlappingAppointment) {
      throw new Error("This time slot is already booked");
    }

    const { success, error: creditError, cost } =
      await deductCreditsForAppointment(patient.id, doctor.id);

    if (!success) {
      throw new Error(creditError || "Failed to deduct credits");
    }

    const appointment = await db.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        startTime,
        endTime,
        patientDescription,
        status: "SCHEDULED",
        lockedCredits: cost ?? 0,
        creditsReleased: false,
        videoSessionId: null,
      },
    });

    const callId = await ensureStreamCall(appointment.id, patient.id);
    await db.appointment.update({ where: { id: appointment.id }, data: { videoSessionId: callId } });

    revalidatePath("/appointments");
    revalidatePath("/doctor");
    return { success: true, appointment: appointment };
  } catch (error) {
    console.error("Failed to book appointment:", error);
    throw new Error("Failed to book appointment:" + error.message);
  }
}

/**
 * Generate a token for a video session
 * This will be called when either doctor or patient is about to join the call
 */
export async function generateVideoToken(formData) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  const authUser = data?.user;

  if (error || !authUser) {
    throw new Error("Unauthorized");
  }

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

    // Find the appointment and verify the user is part of it
    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify the user is either the doctor or the patient for this appointment
    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("You are not authorized to join this call");
    }

    // Verify the appointment is scheduled
    if (appointment.status !== "SCHEDULED") {
      throw new Error("This appointment is not currently scheduled");
    }

    // Ensure session id is set
    let sessionId = appointment.videoSessionId || appointment.id;
    if (!appointment.videoSessionId) {
      await db.appointment.update({
        where: { id: appointmentId },
        data: { videoSessionId: sessionId },
      });
    }

    // Verify the appointment is within a valid time range
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const timeDifference = (appointmentTime - now) / (1000 * 60); // difference in minutes

    if (timeDifference > 30) {
      return { error: "Video call opens 30 minutes before appointment" };
    }

    const apiKey = (process.env.NEXT_PUBLIC_STREAM_API_KEY || "").trim();
    const secret = (process.env.STREAM_SECRET_KEY || "").trim();
    if (!apiKey || !secret) {
      return { error: "Video service not configured" };
    }
    const { StreamClient } = await import("@stream-io/node-sdk");
    const client = new StreamClient({ apiKey, secret });
    try {
      await client.video.call("default", sessionId).getOrCreate({ created_by_id: user.id });
    } catch {}
    let token;
    try {
      token = client.createToken(user.id);
    } catch (e) {
      return { error: "Video service not configured" };
    }

    // Update the appointment with the token
    await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        videoSessionToken: token,
      },
    });

    return {
      success: true,
      videoSessionId: sessionId,
      token: token,
    };
  } catch (error) {
    const msg = String(error?.message || "").toLowerCase();
    if (msg.includes("secret") || msg.includes("privatekey")) {
      return { error: "Video service not configured" };
    }
    return { error: "Failed to generate video token" };
  }
}

/**
 * Get doctor by ID
 */
export async function getDoctorById(doctorId) {
  try {
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    return { doctor };
  } catch (error) {
    console.error("Failed to fetch doctor:", error);
    throw new Error("Failed to fetch doctor details");
  }
}

/**
 * Get available time slots for booking for the next 4 days
 */
export async function getAvailableTimeSlots(doctorId) {
  try {
    // Validate doctor existence and verification
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found or not verified");
    }

    // Fetch all availability windows for this doctor
    const availabilities = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
        status: "AVAILABLE",
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (!availabilities || availabilities.length === 0) {
      throw new Error("No availability set by doctor");
    }

    // Get the next 4 days
    const now = new Date();
    const days = [now, addDays(now, 1), addDays(now, 2), addDays(now, 3)];

    // Fetch existing appointments for the doctor over the next 4 days
    const lastOverlapDay = endOfDay(addDays(days[3], 1));
    const existingAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "SCHEDULED",
        startTime: {
          lte: lastOverlapDay,
        },
      },
    });

    const availableSlotsByDay = {};
    const tz = "Africa/Lagos";
    const fmtTime = (d) =>
      new Intl.DateTimeFormat("en-NG", {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    const fmtDay = (d) =>
      new Intl.DateTimeFormat("en-NG", {
        timeZone: tz,
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(d);

    // For each of the next 4 days, generate available slots
    for (const day of days) {
      const dayString = format(day, "yyyy-MM-dd");
      availableSlotsByDay[dayString] = [];
      const seen = new Set();

      for (const availability of availabilities) {
        const availabilityStartTemplate = new Date(availability.startTime);
        const availabilityEndTemplate = new Date(availability.endTime);
        const startHour = availabilityStartTemplate.getHours();
        const startMinute = availabilityStartTemplate.getMinutes();
        const endHour = availabilityEndTemplate.getHours();
        const endMinute = availabilityEndTemplate.getMinutes();
        const isOvernight =
          availabilityEndTemplate.getDate() !==
            availabilityStartTemplate.getDate() ||
          availabilityEndTemplate <= availabilityStartTemplate;

        const availabilityStart = new Date(day);
        availabilityStart.setHours(startHour, startMinute, 0, 0);

        const availabilityEndBase = new Date(day);
        availabilityEndBase.setHours(endHour, endMinute, 0, 0);
        const availabilityEnd = isOvernight
          ? addDays(availabilityEndBase, 1)
          : availabilityEndBase;

        let current = new Date(availabilityStart);
        const end = new Date(availabilityEnd);

        while (
          isBefore(addMinutes(current, 30), end) ||
          +addMinutes(current, 30) === +end
        ) {
          const next = addMinutes(current, 30);

          if (isBefore(current, now)) {
            current = next;
            continue;
          }

          const overlaps = existingAppointments.some((appointment) => {
            const aStart = new Date(appointment.startTime);
            const aEnd = new Date(appointment.endTime);

            return (
              (current >= aStart && current < aEnd) ||
              (next > aStart && next <= aEnd) ||
              (current <= aStart && next >= aEnd)
            );
          });

          const key = `${current.getTime()}-${next.getTime()}`;

          if (!overlaps && !seen.has(key)) {
            seen.add(key);
            availableSlotsByDay[dayString].push({
              startTime: current.toISOString(),
              endTime: next.toISOString(),
              startTimeMs: current.getTime(),
              endTimeMs: next.getTime(),
              formatted: `${fmtTime(current)} - ${fmtTime(next)}`,
              day: fmtDay(current),
            });
          }

          current = next;
        }
      }
    }

    // Convert to array of slots grouped by day for easier consumption by the UI
    const result = Object.entries(availableSlotsByDay).map(([date, slots]) => ({
      date,
      displayDate: slots.length > 0 ? slots[0].day : fmtDay(new Date(date + "T00:00:00Z")),
      slots,
    }));

    return { days: result };
  } catch (error) {
    console.error("Failed to fetch available slots:", error);
    throw new Error("Failed to fetch available time slots: " + error.message);
  }
}
