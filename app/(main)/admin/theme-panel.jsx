"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { updateSiteSettings } from "@/actions/site-settings";
import { toast } from "sonner";

export default function ThemePanel({ initialTheme }) {
  const { theme, setTheme } = useTheme();

  const onSave = async () => {
    const fd = new FormData();
    fd.append("theme", theme || initialTheme || "dark");
    try {
      await updateSiteSettings(fd);
      toast.success("Theme updated");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Theme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={theme || initialTheme || "dark"}
          onChange={(e) => setTheme(e.target.value)}
          className="bg-background border-emerald-900/20"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </Select>
        <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700">Save Theme</Button>
      </CardContent>
    </Card>
  );
}

