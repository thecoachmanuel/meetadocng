"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { adminAdjustUserCredits } from "@/actions/admin";
import { toast } from "sonner";

export function NewUsers({ users }) {
  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">New Users</CardTitle>
      </CardHeader>
      <CardContent>
        {!users || users.length === 0 ? (
          <div className="text-muted-foreground">No new users.</div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{u.name || u.email}</div>
                  <div className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</div>
                </div>
                <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">
                  {u.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UserCreditsManager() {
  const { loading, data, fn: submitAdjustment } = useFetch(adminAdjustUserCredits);
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState(0);
  const [mode, setMode] = useState("sale");

  useEffect(() => {
    if (data?.success) {
      setCredits(0);
      toast.success("User credits updated successfully");
    }
  }, [data]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("email", email);
    fd.append("credits", String(credits));
    fd.append("mode", mode);
    try {
      await submitAdjustment(fd);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">User Credits</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Credits</Label>
            <Input
              type="number"
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              min={1}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Action</Label>
            <select
              className="w-full rounded-md border border-emerald-900/30 bg-background px-3 py-2 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
           >
              <option value="sale">Sell credits (record as purchase)</option>
              <option value="gift">Gift credits (free)</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? "Updating..." : "Apply"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
