import { getDoctorById, getAvailableTimeSlots } from "@/actions/appointments";
import { DoctorProfile } from "./_components/doctor-profile";
import { getSettings } from "@/lib/settings";
import { redirect } from "next/navigation";

export default async function DoctorProfilePage({ params }) {
  const { id } = await params;

  try {
    // Fetch doctor data, available slots, and site settings in parallel
    const [doctorData, slotsData, settings] = await Promise.all([
      getDoctorById(id),
      getAvailableTimeSlots(id),
      getSettings(),
    ]);

    return (
      <DoctorProfile
        doctor={doctorData.doctor}
        availableDays={slotsData.days || []}
        nairaRate={settings.creditToNairaRate || 1000}
        appointmentCreditCost={settings.appointmentCreditCost || 2}
      />
    );
  } catch (error) {
    console.error("Error loading doctor profile:", error);
    redirect("/doctors");
  }
}
