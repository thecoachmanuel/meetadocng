"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { adminAdjustUserCredits } from "@/actions/admin";
import { toast } from "sonner";

export function NewUsers({ users }) {
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const derivedUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const query = search.toLowerCase().trim();

    const filtered = list.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "name") {
        const aName = (a.name || a.email || "").toLowerCase();
        const bName = (b.name || b.email || "").toLowerCase();
        if (aName < bName) return -1 * dir;
        if (aName > bName) return 1 * dir;
        return 0;
      }
      if (sortKey === "credits") {
        const aCredits = a.credits || 0;
        const bCredits = b.credits || 0;
        if (aCredits < bCredits) return -1 * dir;
        if (aCredits > bCredits) return 1 * dir;
        return 0;
      }
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      if (aDate < bDate) return -1 * dir;
      if (aDate > bDate) return 1 * dir;
      return 0;
    });

    return sorted;
  }, [users, roleFilter, search, sortKey, sortDirection]);

  const totalPatients = (Array.isArray(users) ? users : []).filter((u) => u.role === "PATIENT").length;
  const totalDoctors = (Array.isArray(users) ? users : []).filter((u) => u.role === "DOCTOR").length;
  const totalAdmins = (Array.isArray(users) ? users : []).filter((u) => u.role === "ADMIN").length;

  const onChangeSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "name" ? "asc" : "desc");
    }
  };

  const hasUsers = derivedUsers.length > 0;

  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold text-white">New Users</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Recently created accounts with quick filters for patients and doctors.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
            <span>Patients: {totalPatients}</span>
            <span>Doctors: {totalDoctors}</span>
            <span>Admins: {totalAdmins}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground md:hidden">
            <span>Patients: {totalPatients}</span>
            <span>Doctors: {totalDoctors}</span>
            <span>Admins: {totalAdmins}</span>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs uppercase tracking-wide">Search</Label>
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 bg-background/60 border-emerald-900/40 text-sm"
              />
            </div>
            <div className="w-full sm:w-40 space-y-1">
              <Label className="text-xs uppercase tracking-wide">Role</Label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-emerald-900/40 bg-background/60 px-2 text-xs text-foreground"
              >
                <option value="ALL">All roles</option>
                <option value="PATIENT">Patients</option>
                <option value="DOCTOR">Doctors</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>
          </div>
        </div>

        {!hasUsers ? (
          <div className="text-sm text-muted-foreground">No users match the current filters.</div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-emerald-900/30 bg-background/40">
            <table className="w-full text-sm">
              <thead className="bg-emerald-950/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => onChangeSort("name")}
                      className="inline-flex items-center gap-1 hover:text-emerald-300"
                    >
                      <span>User</span>
                      <span className="text-[10px]">
                        {sortKey === "name" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onChangeSort("credits")}
                      className="inline-flex items-center gap-1 hover:text-emerald-300"
                    >
                      <span>Credits</span>
                      <span className="text-[10px]">
                        {sortKey === "credits" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </button>
                  </th>
                  <th className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onChangeSort("createdAt")}
                      className="inline-flex items-center gap-1 hover:text-emerald-300"
                    >
                      <span>Joined</span>
                      <span className="text-[10px]">
                        {sortKey === "createdAt" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {derivedUsers.map((u) => (
                  <tr key={u.id} className="border-t border-emerald-900/20 hover:bg-emerald-950/20">
                    <td className="px-3 py-2 align-middle">
                      <div className="text-sm font-medium text-white">{u.name || "Unnamed"}</div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="text-xs text-muted-foreground break-all">{u.email}</div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Badge className="bg-emerald-900/20 border-emerald-900/40 text-emerald-300 text-[11px]">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 align-middle text-right">
                      <span className="text-sm text-white">{u.credits ?? 0}</span>
                    </td>
                    <td className="px-3 py-2 align-middle text-right">
                      <span className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
