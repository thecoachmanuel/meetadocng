"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { uploadSiteAsset, updateSiteSettings } from "@/actions/site-settings";
import { toast } from "sonner";
import { creditBenefits, testimonials } from "@/lib/data";

export default function SiteSettingsPanel({ initialSettings }) {
  const [siteTitle, setSiteTitle] = useState(initialSettings.siteTitle || "");
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(initialSettings.faviconUrl || "");
  const [heroImageUrl, setHeroImageUrl] = useState(initialSettings.heroImageUrl || "");
  const hs = initialSettings.homepageSections || {};
  const [sections, setSections] = useState(Array.isArray(hs.features) ? hs.features : Array.isArray(hs) ? hs : []);
  const [creditBenefitsList, setCreditBenefitsList] = useState(
    Array.isArray(hs.creditBenefits) && hs.creditBenefits.length
      ? hs.creditBenefits
      : creditBenefits
  );
  const [heroBadge, setHeroBadge] = useState(hs?.hero?.badge || "Healthcare, made easy");
  const [heroTitleLine1, setHeroTitleLine1] = useState(
    hs?.hero?.titleLine1 || "Your doctor is just a tap away"
  );
  const [heroTitleHighlightLine2, setHeroTitleHighlightLine2] = useState(
    hs?.hero?.titleHighlightLine2 || "trusted care, anytime"
  );
  const [heroDescription, setHeroDescription] = useState(
    hs?.hero?.description ||
      "MeetADoc connects you to licensed doctors for secure video consultations, prescriptions, and follow-up care — all from the comfort of your home."
  );
  const [heroPrimaryCtaText, setHeroPrimaryCtaText] = useState(hs?.hero?.primaryCtaText || "Get Started");
  const [heroPrimaryCtaLink, setHeroPrimaryCtaLink] = useState(hs?.hero?.primaryCtaLink || "/onboarding");
  const [heroSecondaryCtaText, setHeroSecondaryCtaText] = useState(hs?.hero?.secondaryCtaText || "Find Doctors");
  const [heroSecondaryCtaLink, setHeroSecondaryCtaLink] = useState(hs?.hero?.secondaryCtaLink || "/doctors");
  const [creditBenefitText, setCreditBenefitText] = useState("");
  const [ctaTitle, setCtaTitle] = useState(
    hs?.cta?.title || "Ready to put your health first?"
  );
  const [ctaDescription, setCtaDescription] = useState(
    hs?.cta?.description ||
      "Join thousands of people using MeetADoc to talk to doctors faster, without leaving home."
  );
  const [ctaPrimaryCtaText, setCtaPrimaryCtaText] = useState(
    hs?.cta?.primaryCtaText || "Get started in minutes"
  );
  const [ctaPrimaryCtaLink, setCtaPrimaryCtaLink] = useState(
    hs?.cta?.primaryCtaLink || "/onboarding"
  );
  const [ctaSecondaryCtaText, setCtaSecondaryCtaText] = useState(
    hs?.cta?.secondaryCtaText || "See consultation prices"
  );
  const [ctaSecondaryCtaLink, setCtaSecondaryCtaLink] = useState(
    hs?.cta?.secondaryCtaLink || "#pricing"
  );
  const [footerCopyright, setFooterCopyright] = useState(
    hs?.footerCopyright || `© ${new Date().getFullYear()} MeetADoc. All rights reserved.`
  );
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDesc, setSectionDesc] = useState("");
  const [testimonialsList, setTestimonialsList] = useState(
    Array.isArray(hs.testimonials) && hs.testimonials.length
      ? hs.testimonials
      : testimonials
  );
  const [testimonialInitials, setTestimonialInitials] = useState("");
  const [testimonialName, setTestimonialName] = useState("");
  const [testimonialRole, setTestimonialRole] = useState("");
  const [testimonialQuote, setTestimonialQuote] = useState("");
  const [editingCreditIndex, setEditingCreditIndex] = useState(-1);
  const [editingCreditText, setEditingCreditText] = useState("");

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
    fd.append(
      "homepageSections",
      JSON.stringify({
        hero: {
          badge: heroBadge,
          titleLine1: heroTitleLine1,
          titleHighlightLine2: heroTitleHighlightLine2,
          description: heroDescription,
          primaryCtaText: heroPrimaryCtaText,
          primaryCtaLink: heroPrimaryCtaLink,
          secondaryCtaText: heroSecondaryCtaText,
          secondaryCtaLink: heroSecondaryCtaLink,
        },
        creditBenefits: creditBenefitsList || [],
        cta: {
          title: ctaTitle,
          description: ctaDescription,
          primaryCtaText: ctaPrimaryCtaText,
          primaryCtaLink: ctaPrimaryCtaLink,
          secondaryCtaText: ctaSecondaryCtaText,
          secondaryCtaLink: ctaSecondaryCtaLink,
        },
        testimonials: testimonialsList || [],
        footerCopyright,
        features: sections || [],
      })
    );
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
        <CardDescription>Control branding, homepage content, and messaging across the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="space-y-8">
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

          <div className="space-y-2">
            <Label>Hero Content</Label>
            <div className="grid md:grid-cols-2 gap-3">
              <Input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} placeholder="Badge" />
              <Input value={heroTitleLine1} onChange={(e) => setHeroTitleLine1(e.target.value)} placeholder="Title line 1" />
              <Input
                value={heroTitleHighlightLine2}
                onChange={(e) => setHeroTitleHighlightLine2(e.target.value)}
                placeholder="Title highlight line 2"
              />
              <Textarea
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder="Description"
                className="md:col-span-2 min-h-[80px]"
              />
              <Input value={heroPrimaryCtaText} onChange={(e) => setHeroPrimaryCtaText(e.target.value)} placeholder="Primary CTA text" />
              <Input value={heroPrimaryCtaLink} onChange={(e) => setHeroPrimaryCtaLink(e.target.value)} placeholder="Primary CTA link" />
              <Input value={heroSecondaryCtaText} onChange={(e) => setHeroSecondaryCtaText(e.target.value)} placeholder="Secondary CTA text" />
              <Input value={heroSecondaryCtaLink} onChange={(e) => setHeroSecondaryCtaLink(e.target.value)} placeholder="Secondary CTA link" />
            </div>
          </div>

          <div className="space-y-3 pt-6 mt-2 border-t border-emerald-900/30">
            <Label>Credit Explainer Bullets</Label>
            <div className="grid md:grid-cols-[1fr_auto] gap-3">
              <Input
                value={creditBenefitText}
                onChange={(e) => setCreditBenefitText(e.target.value)}
                placeholder="Benefit HTML or text (supports basic HTML markup)"
              />
              <Button
                type="button"
                variant="outline"
                className="border-emerald-900/30"
                onClick={() => {
                  if (!creditBenefitText) return;
                  setCreditBenefitsList([...(creditBenefitsList || []), creditBenefitText]);
                  setCreditBenefitText("");
                }}
              >
                Add Benefit
              </Button>
            </div>
            <div className="space-y-2 mt-2">
              {(creditBenefitsList || []).map((b, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3">
                  {editingCreditIndex === idx ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editingCreditText}
                        onChange={(e) => setEditingCreditText(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (!editingCreditText) return;
                            setCreditBenefitsList((creditBenefitsList || []).map((item, i) => (i === idx ? editingCreditText : item)));
                            setEditingCreditIndex(-1);
                            setEditingCreditText("");
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCreditIndex(-1);
                            setEditingCreditText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground flex-1">{b}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {editingCreditIndex !== idx && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCreditIndex(idx);
                          setEditingCreditText(b);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCreditBenefitsList((creditBenefitsList || []).filter((_, i) => i !== idx));
                        if (editingCreditIndex === idx) {
                          setEditingCreditIndex(-1);
                          setEditingCreditText("");
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-6 border-t border-emerald-900/30">
            <Label>Final CTA Section</Label>
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                value={ctaTitle}
                onChange={(e) => setCtaTitle(e.target.value)}
                placeholder="CTA title"
              />
              <Textarea
                value={ctaDescription}
                onChange={(e) => setCtaDescription(e.target.value)}
                placeholder="CTA description"
                className="md:col-span-2 min-h-[80px]"
              />
              <Input
                value={ctaPrimaryCtaText}
                onChange={(e) => setCtaPrimaryCtaText(e.target.value)}
                placeholder="Primary CTA text"
              />
              <Input
                value={ctaPrimaryCtaLink}
                onChange={(e) => setCtaPrimaryCtaLink(e.target.value)}
                placeholder="Primary CTA link"
              />
              <Input
                value={ctaSecondaryCtaText}
                onChange={(e) => setCtaSecondaryCtaText(e.target.value)}
                placeholder="Secondary CTA text"
              />
              <Input
                value={ctaSecondaryCtaLink}
                onChange={(e) => setCtaSecondaryCtaLink(e.target.value)}
                placeholder="Secondary CTA link"
              />
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-emerald-900/30">
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

          <div className="space-y-3 pt-6 border-t border-emerald-900/30">
            <Label>Testimonials</Label>
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                value={testimonialInitials}
                onChange={(e) => setTestimonialInitials(e.target.value)}
                placeholder="Initials (e.g. SP)"
              />
              <Input
                value={testimonialName}
                onChange={(e) => setTestimonialName(e.target.value)}
                placeholder="Name"
              />
              <Input
                value={testimonialRole}
                onChange={(e) => setTestimonialRole(e.target.value)}
                placeholder="Role (e.g. Patient, Cardiologist)"
              />
              <Textarea
                value={testimonialQuote}
                onChange={(e) => setTestimonialQuote(e.target.value)}
                placeholder="Testimonial quote"
                className="md:col-span-2"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-emerald-900/30"
              onClick={() => {
                if (!testimonialName || !testimonialQuote) return;
                setTestimonialsList([
                  ...(testimonialsList || []),
                  {
                    initials: testimonialInitials || "",
                    name: testimonialName,
                    role: testimonialRole || "",
                    quote: testimonialQuote,
                  },
                ]);
                setTestimonialInitials("");
                setTestimonialName("");
                setTestimonialRole("");
                setTestimonialQuote("");
              }}
            >
              Add Testimonial
            </Button>
            <div className="space-y-2 mt-2">
              {(testimonialsList || []).map((t, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3">
                  <div className="text-sm text-muted-foreground flex-1">
                    <div className="font-medium text-white">
                      {t.name} {t.role ? `· ${t.role}` : ""}
                    </div>
                    <div className="text-xs text-emerald-400">{t.initials}</div>
                    <div className="mt-1">{t.quote}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setTestimonialsList((testimonialsList || []).filter((_, i) => i !== idx));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-6 border-t border-emerald-900/30">
            <Label>Footer Copyright</Label>
            <Input value={footerCopyright} onChange={(e) => setFooterCopyright(e.target.value)} placeholder="© 2026 Company. All rights reserved." />
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
}
