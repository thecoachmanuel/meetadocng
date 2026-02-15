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

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getZoomAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now + 60_000) {
    return cachedToken;
  }

  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom account OAuth credentials are not configured");
  }

  const basicAuth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");

  const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  });

  if (!response.ok) {
    let details = "";
    try {
      const errorBody = await response.text();
      details = errorBody.slice(0, 300);
    } catch {}
    throw new Error(
      `Failed to obtain Zoom access token: ${response.status} ${response.statusText} ${details}`.trim()
    );
  }

  const data = await response.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

export async function POST(request) {
  try {
    if (!ZOOM_SDK_KEY || !ZOOM_SDK_SECRET) {
      return NextResponse.json(
        { error: "Zoom SDK credentials are not configured" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const role = body.role === 1 ? 1 : 0;
    const sessionId = body.sessionId;

    let meetingNumber;
    let meetingPassword;

    if (sessionId) {
      const appointment = await db.appointment.findUnique({
        where: { id: sessionId },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found for Zoom meeting" },
          { status: 404 }
        );
      }

      if (!appointment.zoomMeetingId) {
        const accessToken = await getZoomAccessToken();

        const durationMinutes = Math.max(
          15,
          Math.round(
            (appointment.endTime.getTime() - appointment.startTime.getTime()) /
              60000
          )
        );

        const meetingResponse = await fetch("https://api.zoom.us/v2/users/me/meetings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: "Appointment Consultation",
            type: 2,
            start_time: appointment.startTime.toISOString(),
            duration: durationMinutes,
          }),
        });

        if (!meetingResponse.ok) {
          return NextResponse.json(
            { error: "Failed to create Zoom meeting for appointment" },
            { status: 500 }
          );
        }

        const meetingData = await meetingResponse.json();

        const updated = await db.appointment.update({
          where: { id: appointment.id },
          data: {
            zoomMeetingId: String(meetingData.id),
            zoomMeetingPassword: meetingData.password || null,
            zoomJoinUrl: meetingData.join_url || null,
          },
        });

        meetingNumber = Number(updated.zoomMeetingId);
        meetingPassword = updated.zoomMeetingPassword || "";
      } else {
        meetingNumber = Number(appointment.zoomMeetingId);
        meetingPassword = appointment.zoomMeetingPassword || "";
      }
    } else if (ZOOM_MEETING_NUMBER) {
      meetingNumber = Number(ZOOM_MEETING_NUMBER);
      meetingPassword = ZOOM_MEETING_PASSWORD || "";
    } else {
      return NextResponse.json(
        { error: "No Zoom meeting configuration available" },
        { status: 500 }
      );
    }

    const signature = generateZoomSignature(meetingNumber, role);

    return NextResponse.json({
      signature,
      sdkKey: ZOOM_SDK_KEY,
      meetingNumber,
      password: meetingPassword,
      role,
    });
  } catch (error) {
    console.error("Zoom signature generation error:", error);
    const message = error && typeof error.message === "string"
      ? error.message
      : "Failed to generate Zoom meeting signature";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
