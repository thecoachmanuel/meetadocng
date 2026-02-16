import { NextResponse } from "next/server";
import { getAnalytics, verifyAdmin } from "@/actions/admin";

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const stats = await getAnalytics();

  const usersMonthlyCalls = stats.usersMonthlyCalls || [];
  const usersAllTimeCalls = stats.usersAllTimeCalls || [];
  const doctorsMonthlyEarnings = stats.doctorsMonthlyEarnings || [];
  const doctorsAllTimeEarnings = stats.doctorsAllTimeEarnings || [];
  const adminResolutions = stats.adminResolutions || [];
  const platformFees = stats.platformFees || {};

  const rows = [];

  rows.push(["Section", "Name", "Email", "Metric", "Value"]);

  usersMonthlyCalls.forEach((u) => {
    rows.push(["Users Monthly Calls", u.name || "", u.email || "", "Calls", String(u.calls ?? 0)]);
  });

  usersAllTimeCalls.forEach((u) => {
    rows.push(["Users All Time Calls", u.name || "", u.email || "", "Calls", String(u.calls ?? 0)]);
  });

  doctorsMonthlyEarnings.forEach((d) => {
    rows.push([
      "Doctors Monthly Earnings",
      d.name || "",
      d.email || "",
      "Naira",
      String(d.naira ?? 0),
    ]);
  });

  doctorsAllTimeEarnings.forEach((d) => {
    rows.push([
      "Doctors All Time Earnings",
      d.name || "",
      d.email || "",
      "Naira",
      String(d.naira ?? 0),
    ]);
  });

  const monthlyBySpecialty = new Map();
  doctorsMonthlyEarnings.forEach((d) => {
    const spec = (d.specialty || "Unspecified").trim() || "Unspecified";
    const current = monthlyBySpecialty.get(spec) || {
      naira: 0,
      points: 0,
      doctors: 0,
    };
    current.naira += d.naira || 0;
    current.points += d.points || 0;
    current.doctors += 1;
    monthlyBySpecialty.set(spec, current);
  });

  const allTimeBySpecialty = new Map();
  doctorsAllTimeEarnings.forEach((d) => {
    const spec = (d.specialty || "Unspecified").trim() || "Unspecified";
    const current = allTimeBySpecialty.get(spec) || {
      naira: 0,
      points: 0,
      doctors: 0,
    };
    current.naira += d.naira || 0;
    current.points += d.points || 0;
    current.doctors += 1;
    allTimeBySpecialty.set(spec, current);
  });

  Array.from(monthlyBySpecialty.entries()).forEach(([spec, agg]) => {
    const doctorCount = agg.doctors || 0;
    const avgNaira = doctorCount > 0 ? agg.naira / doctorCount : 0;
    const avgPoints = doctorCount > 0 ? agg.points / doctorCount : 0;

    rows.push([
      "Doctors Monthly By Specialty",
      spec,
      "",
      "Naira",
      String(agg.naira ?? 0),
    ]);
    rows.push([
      "Doctors Monthly By Specialty",
      spec,
      "",
      "Points",
      String(agg.points ?? 0),
    ]);
    rows.push([
      "Doctors Monthly By Specialty",
      spec,
      "",
      "Doctor Count",
      String(doctorCount),
    ]);
    rows.push([
      "Doctors Monthly By Specialty",
      spec,
      "",
      "Avg Naira Per Doctor",
      String(avgNaira.toFixed(2)),
    ]);
    rows.push([
      "Doctors Monthly By Specialty",
      spec,
      "",
      "Avg Points Per Doctor",
      String(avgPoints.toFixed(2)),
    ]);
  });

  Array.from(allTimeBySpecialty.entries()).forEach(([spec, agg]) => {
    const doctorCount = agg.doctors || 0;
    const avgNaira = doctorCount > 0 ? agg.naira / doctorCount : 0;
    const avgPoints = doctorCount > 0 ? agg.points / doctorCount : 0;

    rows.push([
      "Doctors All Time By Specialty",
      spec,
      "",
      "Naira",
      String(agg.naira ?? 0),
    ]);
    rows.push([
      "Doctors All Time By Specialty",
      spec,
      "",
      "Points",
      String(agg.points ?? 0),
    ]);
    rows.push([
      "Doctors All Time By Specialty",
      spec,
      "",
      "Doctor Count",
      String(doctorCount),
    ]);
    rows.push([
      "Doctors All Time By Specialty",
      spec,
      "",
      "Avg Naira Per Doctor",
      String(avgNaira.toFixed(2)),
    ]);
    rows.push([
      "Doctors All Time By Specialty",
      spec,
      "",
      "Avg Points Per Doctor",
      String(avgPoints.toFixed(2)),
    ]);
  });

  adminResolutions.forEach((r) => {
    rows.push([
      "Admin Resolutions",
      r.doctor?.name || "",
      r.patient?.email || "",
      "Decision",
      r.decision || "",
    ]);
  });

  rows.push([
    "Platform Fees Summary",
    "",
    "",
    "Total This Month",
    String(platformFees.totalThisMonth ?? 0),
  ]);
  rows.push([
    "Platform Fees Summary",
    "",
    "",
    "Total All Time",
    String(platformFees.totalAllTime ?? 0),
  ]);

  (platformFees.timeline || []).forEach((row) => {
    rows.push([
      "Platform Fees Timeline",
      row.month || "",
      "",
      "Platform Fee",
      String(row.platformFee ?? 0),
    ]);
  });

  const csv = rows
    .map((cols) =>
      cols
        .map((value) => {
          const v = value == null ? "" : String(value);
          if (v.includes("\"") || v.includes(",") || v.includes("\n")) {
            return `"${v.replace(/"/g, '""')}"`;
          }
          return v;
        })
        .join(",")
    )
    .join("\n");

  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set(
    "Content-Disposition",
    `attachment; filename="analytics-${new Date().toISOString().slice(0, 10)}.csv"`
  );

  return new NextResponse(csv, { status: 200, headers });
}
