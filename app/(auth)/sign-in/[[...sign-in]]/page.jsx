"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signInEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Failed to sign in");
      return;
    }
    try {
      const res = await fetch("/api/me", { method: "POST" });
      const data = await res.json();
      const role = data?.user?.role || "UNASSIGNED";
      const redirectMap = {
        ADMIN: "/admin",
        DOCTOR: "/doctor",
        PATIENT: "/appointments",
        UNASSIGNED: "/onboarding",
      };
      window.location.href = redirectMap[role] || "/";
    } catch {
      window.location.href = "/";
    }
  };

  const signInGoogle = async () => {
    setLoading(true);
    const siteUrl =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        : undefined;
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: siteUrl ? `${siteUrl}/auth/callback` : undefined,
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  return (
    <Card className="border-emerald-900/30 w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sign In</h1>
          <p className="text-muted-foreground">Access your account</p>
        </div>

        <form onSubmit={signInEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ring-offset-background"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ring-offset-background"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>New here?</span>
          <Link className="text-emerald-400 hover:text-emerald-300" href="/sign-up">Create an account</Link>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-emerald-900/30" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button variant="outline" onClick={signInGoogle} disabled={loading} className="w-full border-emerald-900/40">
          Google
        </Button>
      </CardContent>
    </Card>
  );
}
