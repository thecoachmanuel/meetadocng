import { db } from "@/lib/prisma";

export async function getSettings() {
  try {
    const s = await db.siteSettings.findUnique({ where: { id: "singleton" } });
    if (s) {
      return s;
    }

    return {
      id: "singleton",
      siteTitle: "MeetADoc",
      logoUrl: "/logo-single.png",
      faviconUrl: "/logo.png",
      heroImageUrl: "/banner2.png",
      homepageSections: {
        hero: {
          badge: "Healthcare made simple",
          titleLine1: "Connect with doctors",
          titleHighlightLine2: "anytime, anywhere",
          description:
            "Book appointments, consult via video, and manage your healthcare journey all in one secure platform.",
          primaryCtaText: "Get Started",
          primaryCtaLink: "/onboarding",
          secondaryCtaText: "Find Doctors",
          secondaryCtaLink: "/doctors",
        },
        footerCopyright: `© ${new Date().getFullYear()} MeetADoc. All rights reserved.`,
        features: [],
      },
      theme: "dark",
      appointmentCreditCost: 2,
      doctorEarningPerCredit: 8,
      creditToNairaRate: 1000,
      adminEarningPercentage: 20,
      freeCredits: 2,
      standardCredits: 10,
      premiumCredits: 24,
    };
  } catch {
    return {
      id: "singleton",
      siteTitle: "MeetADoc",
      logoUrl: "/logo-single.png",
      faviconUrl: "/logo.png",
      heroImageUrl: "/banner2.png",
      homepageSections: {
        hero: {
          badge: "Healthcare made simple",
          titleLine1: "Connect with doctors",
          titleHighlightLine2: "anytime, anywhere",
          description:
            "Book appointments, consult via video, and manage your healthcare journey all in one secure platform.",
          primaryCtaText: "Get Started",
          primaryCtaLink: "/onboarding",
          secondaryCtaText: "Find Doctors",
          secondaryCtaLink: "/doctors",
        },
        footerCopyright: `© ${new Date().getFullYear()} MeetADoc. All rights reserved.`,
        features: [],
      },
      theme: "dark",
      appointmentCreditCost: 2,
      doctorEarningPerCredit: 8,
      creditToNairaRate: 1000,
      adminEarningPercentage: 20,
      freeCredits: 2,
      standardCredits: 10,
      premiumCredits: 24,
    };
  }
}
