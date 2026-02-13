"use client";
import { Button } from "./ui/button";
import { supabaseClient } from "@/lib/supabase-client";

export default function SignOutButton() {
  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "/";
  };

  return (
    <Button
      variant="outline"
      className="border-emerald-700/40 text-emerald-200 hover:bg-emerald-900/30 hover:text-emerald-100"
      onClick={handleSignOut}
    >
      Sign Out
    </Button>
  );
}
