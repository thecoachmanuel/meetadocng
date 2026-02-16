"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, Plus, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { setAvailabilitySlots, deleteAvailabilitySlot } from "@/actions/doctor";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function AvailabilitySettings({ slots, appointments = [] }) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  // Custom hook for server action
  const { loading, fn: submitSlots, data } = useFetch(setAvailabilitySlots);
  const {
    loading: deleting,
    fn: submitDelete,
    data: deleteResult,
  } = useFetch(deleteAvailabilitySlot);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      startTime: "",
      endTime: "",
    },
  });

  function createLocalDateFromTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const now = new Date();
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );
    return date;
  }

  function buildIntervals(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    const sMinutes = s.getHours() * 60 + s.getMinutes();
    const eMinutes = e.getHours() * 60 + e.getMinutes();
    if (eMinutes > sMinutes) {
      return [[sMinutes, eMinutes]];
    }
    return [
      [sMinutes, 24 * 60],
      [0, eMinutes],
    ];
  }

  function hasUpcomingAppointmentsForSlot(slot) {
    const slotIntervals = buildIntervals(slot.startTime, slot.endTime);
    const now = new Date();
    return appointments.some((appointment) => {
      const appointmentEnd = new Date(appointment.endTime);
      if (appointmentEnd < now) {
        return false;
      }
      const appointmentIntervals = buildIntervals(
        appointment.startTime,
        appointment.endTime
      );
      return slotIntervals.some(([s1, e1]) =>
        appointmentIntervals.some(([s2, e2]) => s1 < e2 && s2 < e1)
      );
    });
  }

  // Handle slot submission
  const onSubmit = async (data) => {
    if (loading) return;

    const formData = new FormData();

    const today = new Date().toISOString().split("T")[0];

    const startDate = createLocalDateFromTime(data.startTime);
    const endDate = createLocalDateFromTime(data.endTime);

    if (startDate.getTime() === endDate.getTime()) {
      toast.error("Start time and end time cannot be the same");
      return;
    }

    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    // Add to form data
    formData.append("startTime", startDate.toISOString());
    formData.append("endTime", endDate.toISOString());

    await submitSlots(formData);
  };

  const handleDeleteSlot = async (slotId) => {
    if (deleting) return;

    const formData = new FormData();
    formData.append("slotId", slotId);

    await submitDelete(formData);
  };

  useEffect(() => {
    if (data && data?.success) {
      setShowForm(false);
      toast.success("Availability slots updated successfully");
      router.refresh();
    }
  }, [data, router]);

  useEffect(() => {
    if (deleteResult && deleteResult?.success) {
      toast.success("Availability slot removed");
      router.refresh();
    }
  }, [deleteResult, router]);

  // Format time string for display
  const formatTimeString = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (e) {
      return "Invalid time";
    }
  };

  return (
    <Card className="border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <Clock className="h-5 w-5 mr-2 text-emerald-400" />
          Availability Settings
        </CardTitle>
        <CardDescription>
          Set your daily availability for patient appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Availability Display */}
        {!showForm ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">
                Current Availability
              </h3>

              {slots.length === 0 ? (
                <p className="text-muted-foreground">
                  You haven&apos;t set any availability slots yet. Add your
                  availability to start accepting appointments.
                </p>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot) => {
                    const hasAppointments =
                      hasUpcomingAppointmentsForSlot(slot);
                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/20 border border-emerald-900/20"
                      >
                        <div className="flex items-center">
                          <div className="bg-emerald-900/20 p-2 rounded-full mr-3">
                            <Clock className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {formatTimeString(slot.startTime)} -{" "}
                              {formatTimeString(slot.endTime)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {hasAppointments
                                ? "Has upcoming appointments"
                                : "Available"}
                            </p>
                          </div>
                        </div>
                        {hasAppointments ? (
                          <Badge
                            variant="outline"
                            className="text-xs border-emerald-900/40 text-muted-foreground"
                          >
                            Cannot remove
                          </Badge>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={deleting}
                                className="border-emerald-900/40 text-xs"
                              >
                                Remove
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Remove availability window?
                                </DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to remove this
                                  availability window? Patients will no longer
                                  see new slots in this range.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  disabled={deleting}
                                  onClick={() => handleDeleteSlot(slot.id)}
                                >
                                  Confirm
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Set Availability Time
            </Button>
          </>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 border border-emerald-900/20 rounded-md p-4"
          >
            <h3 className="text-lg font-medium text-white mb-2">
              Set Daily Availability
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register("startTime", {
                    required: "Start time is required",
                  })}
                  className="bg-background border-emerald-900/20"
                />
                {errors.startTime && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register("endTime", { required: "End time is required" })}
                  className="bg-background border-emerald-900/20"
                />
                {errors.endTime && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={loading}
                className="border-emerald-900/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Availability"
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 p-4 bg-muted/10 border border-emerald-900/10 rounded-md">
          <h4 className="font-medium text-white mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-emerald-400" />
            How Availability Works
          </h4>
          <p className="text-muted-foreground text-sm">
            Setting your daily availability allows patients to book appointments
            during those hours. The same availability applies to all days. You
            can update your availability at any time, but existing booked
            appointments will not be affected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
