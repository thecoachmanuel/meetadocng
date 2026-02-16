"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { updateContactMessageStatus } from "@/actions/admin";

export function EnquiriesPanel({ messages }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { loading, fn } = useFetch(updateContactMessageStatus);

  const filtered = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    if (statusFilter === "ALL") return messages;
    return messages.filter((m) => m.status === statusFilter);
  }, [messages, statusFilter]);

  const onChangeStatus = async (id, status) => {
    const fd = new FormData();
    fd.append("id", id);
    fd.append("status", status);
    await fn(fd);
  };

  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-xl font-bold text-white">Enquiries</CardTitle>
        <div className="flex items-center gap-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Filter by status
          </Label>
          <select
            className="rounded-md border border-emerald-900/30 bg-background px-2 py-1 text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!filtered || filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No enquiries to display.
          </div>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-2 border border-emerald-900/20 rounded-md p-3 bg-background/40 md:flex-row md:items-start md:justify-between"
            >
              <div className="space-y-1 text-sm">
                <div className="font-medium text-white">
                  {m.name} 
                  <span className="text-xs text-muted-foreground">• {m.email}</span>
                </div>
                {m.user && (
                  <div className="text-xs text-emerald-400">
                    Linked user: {m.user.name || m.user.email} ({m.user.role})
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
                <div className="text-sm text-white mt-1">{m.subject}</div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {m.message}
                </p>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto">
                <select
                  className="rounded-md border border-emerald-900/30 bg-background px-2 py-1 text-xs"
                  value={m.status}
                  onChange={(e) => onChangeStatus(m.id, e.target.value)}
                  disabled={loading}
                >
                  <option value="NEW">New</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-emerald-900/30 text-xs"
                  onClick={() => onChangeStatus(m.id, "RESOLVED")}
                  disabled={loading || m.status === "RESOLVED"}
                >
                  Mark resolved
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
