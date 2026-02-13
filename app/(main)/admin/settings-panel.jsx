"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadSiteAsset, updateSiteSettings } from "@/actions/site-settings";
import { toast } from "sonner";

export default function SiteSettingsPanel({ initialSettings }) {
  const [siteTitle, setSiteTitle] = useState(initialSettings.siteTitle || "");
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(initialSettings.faviconUrl || "");
  const [heroImageUrl, setHeroImageUrl] = useState(initialSettings.heroImageUrl || "");
  const [sections, setSections] = useState(initialSettings.homepageSections || []);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDesc, setSectionDesc] = useState("");

  const onUpload = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("target", target);
    try {
      const res = await uploadSiteAsset(fd);
      if (target === "logoUrl") setLogoUrl(res.url);
      if (target === "faviconUrl") setFaviconUrl(res.url);
      if (target === "heroImageUrl") setHeroImageUrl(res.url);
      toast.success("Uploaded");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("siteTitle", siteTitle);
    fd.append("logoUrl", logoUrl);
    fd.append("faviconUrl", faviconUrl);
    fd.append("heroImageUrl", heroImageUrl);
    fd.append("homepageSections", JSON.stringify(sections || []));
    try {
      await updateSiteSettings(fd);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Site Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="space-y-6">
          <div className="space-y-2">
            <Label>Site Title</Label>
            <Input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo URL" />
              <Input type="file" accept="image/*" onChange={(e) => onUpload(e, "logoUrl")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Favicon</Label>
            <div className="flex items-center gap-4">
              <Input value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)} placeholder="Favicon URL" />
              <Input type="file" accept="image/*" onChange={(e) => onUpload(e, "faviconUrl")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Hero Image</Label>
            <div className="flex items-center gap-4">
              <Input value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} placeholder="Hero URL" />
              <Input type="file" accept="image/*" onChange={(e) => onUpload(e, "heroImageUrl")} />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Homepage Sections</Label>
            <div className="grid md:grid-cols-2 gap-3">
              <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="Section Title" />
              <Input value={sectionDesc} onChange={(e) => setSectionDesc(e.target.value)} placeholder="Section Description" />
            </div>
            <Button type="button" variant="outline" className="border-emerald-900/30" onClick={() => {
              if (!sectionTitle) return;
              setSections([...(sections || []), { title: sectionTitle, description: sectionDesc }]);
              setSectionTitle("");
              setSectionDesc("");
            }}>Add Section</Button>
            <div className="space-y-2 mt-2">
              {(sections || []).map((s, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => {
                    setSections((sections || []).filter((_, i) => i !== idx));
                  }}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
}
