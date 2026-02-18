"use client";

import { useEffect, useMemo, useState } from "react";
import { getDoctorAppointments } from "@/actions/doctor";
import { AppointmentCard } from "@/components/appointment-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useFetch from "@/hooks/use-fetch";

export default function DoctorAppointmentsList({ appointments: initialAppointments }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("UPCOMING");
  const {
    loading,
    data,
    fn: fetchAppointments,
    setData,
  } = useFetch(getDoctorAppointments);

  useEffect(() => {
    if (initialAppointments && Array.isArray(initialAppointments)) {
      setData({ appointments: initialAppointments });
	} else {
		  fetchAppointments();
		}
	}, []);

  const appointments = data?.appointments || [];

  const filteredAppointments = useMemo(() => {
    const now = new Date();

    const base = [...appointments].filter((appt) => {
      if (statusFilter === "ALL") return true;
      return appt.status === statusFilter;
    });

    const timeFiltered = base.filter((appt) => {
      const start = new Date(appt.startTime);
      if (timeFilter === "ALL") return true;
      if (timeFilter === "UPCOMING") return start >= now;
      if (timeFilter === "PAST") return start < now;
      return true;
    });

    return timeFiltered.sort((a, b) => {
      const aTime = new Date(a.startTime).getTime();
      const bTime = new Date(b.startTime).getTime();
      return bTime - aTime;
    });
  }, [appointments, statusFilter, timeFilter]);

  return (
    <Card className="border-emerald-900/20">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl md:text-2xl font-bold text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-emerald-400" />
            Upcoming Appointments
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Filter className="h-3 w-3" />
              <span>Filter</span>
            </div>
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="h-8"
            >
              <TabsList className="grid grid-cols-4 h-8">
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
                <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
                <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs
              value={timeFilter}
              onValueChange={setTimeFilter}
              className="h-8"
            >
              <TabsList className="grid grid-cols-3 h-8">
                <TabsTrigger value="UPCOMING">Upcoming</TabsTrigger>
                <TabsTrigger value="PAST">Past</TabsTrigger>
                <TabsTrigger value="ALL">All time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            <div className="h-20 rounded-md bg-muted/20 border border-emerald-900/20 animate-pulse" />
            <div className="h-20 rounded-md bg-muted/20 border border-emerald-900/20 animate-pulse" />
            <div className="h-20 rounded-md bg-muted/20 border border-emerald-900/20 animate-pulse" />
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                userRole="DOCTOR"
                refetchAppointments={fetchAppointments}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-xl font-medium text-white mb-2">
              No upcoming appointments
            </h3>
            <p className="text-muted-foreground">
              You don&apos;t have any scheduled appointments yet. Make sure
              you&apos;ve set your availability to allow patients to book.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
