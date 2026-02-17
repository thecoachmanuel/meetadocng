"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  AlertCircle,
  Loader2,
  Stethoscope,
  User,
  Clock,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import {
  releaseAppointmentCredits,
  refundAppointmentCredits,
} from "@/actions/admin";
import { formatNaira } from "@/lib/currency";

export function EscrowAppointments({ appointments }) {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [localAppointments, setLocalAppointments] = useState(appointments || []);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [actionNote, setActionNote] = useState("");

  const {
    loading,
    data,
    error,
    fn: submitRelease,
  } = useFetch(releaseAppointmentCredits);

  const {
    loading: refundLoading,
    data: refundData,
    error: refundError,
    fn: submitRefund,
  } = useFetch(refundAppointmentCredits);

  useEffect(() => {
    setLocalAppointments(appointments || []);
  }, [appointments]);

  useEffect(() => {
    if (data?.success && selectedAppointment && actionType === "release") {
      setLocalAppointments((prev) =>
        prev.filter((appt) => appt.id !== selectedAppointment.id)
      );
      setSelectedAppointment(null);
      setActionType(null);
      toast.success("Credits released to doctor successfully");
    }
  }, [data, selectedAppointment, actionType]);

  useEffect(() => {
    if (refundData?.success && selectedAppointment && actionType === "refund") {
      setLocalAppointments((prev) =>
        prev.filter((appt) => appt.id !== selectedAppointment.id)
      );
      setSelectedAppointment(null);
      setActionType(null);
      toast.success("Credits refunded to patient successfully");
    }
  }, [refundData, selectedAppointment, actionType]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to release credits");
    }
  }, [error]);

  useEffect(() => {
    if (refundError) {
      toast.error(refundError.message || "Failed to refund credits");
    }
  }, [refundError]);

  const handleAction = (appointment, type) => {
    setSelectedAppointment(appointment);
    setActionType(type);
    setActionNote("");
  };

  const confirmAction = async () => {
    if (!selectedAppointment || !actionType) return;

    const formData = new FormData();
    formData.append("appointmentId", selectedAppointment.id);
    if (actionNote) {
      formData.append("note", actionNote);
    }

    if (actionType === "release") {
      await submitRelease(formData);
    } else if (actionType === "refund") {
      await submitRefund(formData);
    }
  };

  const isDialogOpen = !!selectedAppointment && !!actionType;

  const filteredAppointments = useMemo(() => {
    const list = localAppointments.filter((appointment) => {
      const matchesStatus =
        statusFilter === "ALL" || appointment.status === statusFilter;

      const doctorText = `${appointment.doctor?.name || ""} ${
        appointment.doctor?.email || ""
      }`.toLowerCase();
      const filterText = doctorFilter.trim().toLowerCase();
      const matchesDoctor =
        filterText.length === 0 || doctorText.includes(filterText);

      return matchesStatus && matchesDoctor;
    });

    return list.sort((a, b) => {
      const aTime = new Date(a.startTime).getTime();
      const bTime = new Date(b.startTime).getTime();
      return bTime - aTime;
    });
  }, [localAppointments, statusFilter, doctorFilter]);

  return (
    <div className="mt-6">
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-white">
                Escrowed Appointments
              </CardTitle>
              <CardDescription>
                Manage appointments with locked credits and decide whether to
                release to doctors or refund to patients
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">
                  Filter by doctor
                </label>
                <input
                  type="text"
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  placeholder="Search name or email"
                  className="w-full rounded-md border border-emerald-900/30 bg-background px-2 py-1 text-sm text-white placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border border-emerald-900/30 bg-background px-2 py-1 text-sm text-white"
                >
                  <option value="ALL">All</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!localAppointments || localAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No appointments with locked credits at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No appointments match the current filters.
                </div>
              )}
              {filteredAppointments.map((appointment) => {
                const isPast = new Date(appointment.startTime) < new Date();
                const badgeVariant =
                  appointment.status === "COMPLETED"
                    ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                    : appointment.status === "CANCELLED"
                    ? "bg-rose-900/20 border-rose-900/30 text-rose-400"
                    : "bg-amber-900/20 border-amber-900/30 text-amber-400";

                return (
                  <Card
                    key={appointment.id}
                    className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-muted/20 rounded-full p-2 mt-1">
                            <Stethoscope className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-white">
                                Dr. {appointment.doctor?.name || "Unknown"}
                              </p>
                              <Badge
                                variant="outline"
                                className={badgeVariant}
                              >
                                {appointment.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {appointment.doctor?.specialty || "No specialty"}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-emerald-400" />
                                <span>
                                  {format(
                                    new Date(appointment.startTime),
                                    "MMM d, yyyy 'at' h:mm a"
                                  )}
                                  {" "}
                                   b7
                                  {" "}
                                  {format(
                                    new Date(appointment.endTime),
                                    "h:mm a"
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-emerald-400" />
                                <span>
                                  {appointment.patient?.name || "Unknown"} (
                                  {appointment.patient?.email || "no email"})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Coins className="h-4 w-4 text-emerald-400" />
                                <span>
                                  {appointment.lockedCredits} credits  b7
                                  {" "}
                                  {formatNaira(appointment.lockedCreditsNaira || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 self-end lg:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(appointment, "refund")}
                            className="border-emerald-900/30 hover:bg-muted/80"
                            disabled={loading || refundLoading}
                          >
                            {refundLoading &&
                            selectedAppointment?.id === appointment.id &&
                            actionType === "refund" ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Refund to patient
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(appointment, "release")}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={loading || refundLoading || appointment.status === "CANCELLED"}
                          >
                            {loading &&
                            selectedAppointment?.id === appointment.id &&
                            actionType === "release" ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Release to doctor
                          </Button>
                        </div>
                      </div>
                      {isPast && appointment.status === "SCHEDULED" && (
                        <Alert className="mt-3 border-amber-900/40 bg-amber-900/10">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Appointment time has passed but status is still scheduled.
                            Confirm whether to release to doctor or refund to patient.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {actionType === "release" ? "Release Credits" : "Refund Credits"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "release"
                ? "Confirm that you want to release locked credits to the doctor for this appointment."
                : "Confirm that you want to refund locked credits back to the patient for this appointment."}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor</span>
                <span className="text-white">
                  Dr. {selectedAppointment.doctor?.name || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient</span>
                <span className="text-white">
                  {selectedAppointment.patient?.name || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Locked credits</span>
                <span className="text-white">
                  {selectedAppointment.lockedCredits} credits (
                  {formatNaira(selectedAppointment.lockedCreditsNaira || 0)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Appointment time</span>
                <span className="text-white">
                  {format(
                    new Date(selectedAppointment.startTime),
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </span>
              </div>
              <div className="space-y-1 pt-2">
                <label className="text-xs text-muted-foreground" htmlFor="admin-note">
                  Reason / note (optional, visible to admins only)
                </label>
                <textarea
                  id="admin-note"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-emerald-900/40 bg-background px-2 py-1 text-xs text-white placeholder:text-muted-foreground"
                  placeholder="e.g. Patient reported poor connection, refunded credits"
                />
              </div>
            </div>
          )}

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This action will update credits immediately and cannot be undone from
              the dashboard. Proceed only after verifying call outcome and any
              patient disputes.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedAppointment(null);
                setActionType(null);
              }}
              disabled={loading || refundLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmAction}
              className={
                actionType === "release"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-700 hover:bg-rose-800"
              }
              disabled={loading || refundLoading}
            >
              {(loading && actionType === "release") ||
              (refundLoading && actionType === "refund") ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {actionType === "release" ? "Confirm release" : "Confirm refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
