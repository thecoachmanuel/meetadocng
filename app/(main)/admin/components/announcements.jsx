"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { createAnnouncement } from "@/actions/admin";
import { toast } from "sonner";

export function AnnouncementsPanel({ announcements }) {
  const [scope, setScope] = useState("GLOBAL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const { data, loading, fn } = useFetch(createAnnouncement);

  useEffect(() => {
    if (data?.success) {
      setTitle("");
      setBody("");
      setTargetEmail("");
      setScope("GLOBAL");
      toast.success("Announcement created");
    }
  }, [data]);

  const sortedAnnouncements = useMemo(() => {
    if (!announcements || announcements.length === 0) return [];
    return [...announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [announcements]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", title);
    fd.append("body", body);
    fd.append("scope", scope);
    if (scope === "USER") {
      fd.append("targetEmail", targetEmail);
    }
    await fn(fd);
  };

  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">
          Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short headline"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <select
                className="w-full rounded-md border border-emerald-900/30 bg-background px-3 py-2 text-sm"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="GLOBAL">All users</option>
                <option value="USER">Specific user</option>
              </select>
            </div>
          </div>
          {scope === "USER" && (
            <div className="space-y-2">
              <Label htmlFor="targetEmail">User email</Label>
              <Input
                id="targetEmail"
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What do you want users to know?"
              className="min-h-[120px]"
              required
            />
          </div>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send announcement"}
          </Button>
        </form>

        <div className="space-y-3">
          {sortedAnnouncements.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No announcements yet.
            </div>
          ) : (
            sortedAnnouncements.map((a) => (
              <div
                key={a.id}
                className="border border-emerald-900/20 rounded-md p-3 bg-background/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-white">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="mt-1 text-xs text-emerald-400">
                  {a.scope === "GLOBAL" ? "All users" : "Specific user"}
                </div>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                  {a.body}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

