import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";

const ZOOM_SDK_KEY = process.env.ZOOM_SDK_KEY;
const ZOOM_SDK_SECRET = process.env.ZOOM_SDK_SECRET;
const ZOOM_MEETING_NUMBER = process.env.ZOOM_MEETING_NUMBER;
const ZOOM_MEETING_PASSWORD = process.env.ZOOM_MEETING_PASSWORD;

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

function generateZoomSignature(meetingNumber, role) {
  const iat = Math.round(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  const payload = {
    sdkKey: ZOOM_SDK_KEY,
    mn: meetingNumber,
    role,
    iat,
    exp,
    tokenExp: exp,
  };

  return jwt.sign(payload, ZOOM_SDK_SECRET, {
    header: {
      alg: "HS256",
      typ: "JWT",
    },
  });
}

async function getZoomAccessToken() {
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom account credentials are not configured");
  }

  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(
      ZOOM_ACCOUNT_ID
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to obtain Zoom access token");
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Zoom access token not present in response");
  }

  return data.access_token;
}

async function getOrCreateZoomMeetingForAppointment(appointmentId) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: true,
      patient: true,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.zoomMeetingId) {
    return {
      meetingNumber: Number(appointment.zoomMeetingId),
      password: appointment.zoomMeetingPassword || "",
    };
  }

  const accessToken = await getZoomAccessToken();

  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  const durationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / (1000 * 60)) || 30);

  const topicParts = [
    "Consultation",
    appointment.doctor?.name ? `with Dr ${appointment.doctor.name}` : null,
    appointment.patient?.name ? `and ${appointment.patient.name}` : null,
  ].filter(Boolean);

  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: topicParts.join(" "),
      type: 2,
      start_time: start.toISOString(),
      duration: durationMinutes,
      timezone: "UTC",
      settings: {
        waiting_room: true,
        join_before_host: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create Zoom meeting for appointment");
  }

  const meeting = await response.json();

  const updated = await db.appointment.update({
    where: { id: appointmentId },
    data: {
      zoomMeetingId: String(meeting.id),
      zoomMeetingPassword: meeting.password || null,
      zoomJoinUrl: meeting.join_url || null,
    },
  });

  return {
    meetingNumber: Number(updated.zoomMeetingId),
    password: updated.zoomMeetingPassword || "",
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const role = body.role === 1 ? 1 : 0;
    const sessionId = body.sessionId;

    if (!ZOOM_SDK_KEY || !ZOOM_SDK_SECRET) {
      return NextResponse.json(
        { error: "Zoom SDK keys are not configured" },
        { status: 500 }
      );
    }

    if (ZOOM_ACCOUNT_ID && ZOOM_CLIENT_ID && ZOOM_CLIENT_SECRET) {
      if (!sessionId) {
        return NextResponse.json(
          { error: "sessionId is required for per-appointment Zoom meetings" },
          { status: 400 }
        );
      }

      const { meetingNumber, password } = await getOrCreateZoomMeetingForAppointment(sessionId);

      const signature = generateZoomSignature(meetingNumber, role);

      return NextResponse.json({
        signature,
        sdkKey: ZOOM_SDK_KEY,
        meetingNumber,
        password,
        role,
      });
    }

    if (!ZOOM_MEETING_NUMBER) {
      return NextResponse.json(
        { error: "Zoom meeting number is not configured" },
        { status: 500 }
      );
    }

    const meetingNumber = Number(ZOOM_MEETING_NUMBER);
    const signature = generateZoomSignature(meetingNumber, role);

    return NextResponse.json({
      signature,
      sdkKey: ZOOM_SDK_KEY,
      meetingNumber,
      password: ZOOM_MEETING_PASSWORD || "",
      role,
    });
  } catch (error) {
    console.error("Zoom signature generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate Zoom meeting signature" },
      { status: 500 }
    );
  }
}
