import { getPatientAppointments } from "@/actions/patient";
import { AppointmentCard } from "@/components/appointment-card";
import { PageHeader } from "@/components/page-header";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/onboarding";

export const dynamic = "force-dynamic";

export default async function PatientAppointmentsPage({ searchParams }) {
	const referenceParam = searchParams?.reference || searchParams?.trxref;
	if (referenceParam) {
		const params = new URLSearchParams();
		if (typeof searchParams.reference === "string") {
			params.append("reference", searchParams.reference);
		}
		if (typeof searchParams.trxref === "string") {
			params.append("trxref", searchParams.trxref);
		}
		if (typeof searchParams.status === "string") {
			params.append("status", searchParams.status);
		}
		const query = params.toString();
		redirect(`/paystack/callback${query ? `?${query}` : ""}`);
	}

	let user;
	try {
		user = await getCurrentUser();
	} catch (e) {
		console.error("Failed to load current user:", e);
	}

	if (!user) {
		redirect("/sign-in");
	}

	if (user.role === "DOCTOR") {
		redirect("/doctor");
	}

	if (user.role === "ADMIN") {
		redirect("/admin");
	}

	if (user.role !== "PATIENT") {
		redirect("/");
	}

	let appointments = [];
	let error = null;
	try {
		const result = await getPatientAppointments();
		appointments = result?.appointments || [];
		error = result?.error || null;
	} catch (e) {
		console.error("Failed to load patient appointments:", e);
		error = "Failed to load appointments";
	}

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <PageHeader
        icon={<Calendar />}
        title="My Appointments"
        backLink="/doctors"
        backLabel="Find Doctors"
      />

      <Card className="border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-bold text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-emerald-400" />
            Your Scheduled Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-400">Error: {error}</p>
            </div>
          ) : appointments?.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  userRole="PATIENT"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-xl font-medium text-white mb-2">
                No appointments scheduled
              </h3>
              <p className="text-muted-foreground">
                You don&apos;t have any appointments scheduled yet. Browse our
                doctors and book your first consultation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
