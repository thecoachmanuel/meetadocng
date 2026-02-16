import { db } from "@/lib/prisma";

export async function getSettings() {
  try {
    const s = await db.siteSettings.findUnique({ where: { id: "singleton" } });
    if (s) {
      if (typeof s.homepageSections === "string") {
        try {
          s.homepageSections = JSON.parse(s.homepageSections);
        } catch {
        }
      }
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
          badge: "Healthcare, made easy",
          titleLine1: "Your doctor is just a tap away",
          titleHighlightLine2: "trusted care, anytime",
          description:
            "MeetADoc connects you to licensed doctors for secure video consultations, prescriptions, and follow-up care — all from the comfort of your home.",
          primaryCtaText: "Get started in minutes",
          primaryCtaLink: "/onboarding",
          secondaryCtaText: "See available doctors",
          secondaryCtaLink: "/doctors",
        },
        cta: {
          title: "Ready to put your health first?",
          description:
            "Join thousands of people using MeetADoc to talk to doctors faster, without leaving home.",
          primaryCtaText: "Get started in minutes",
          primaryCtaLink: "/onboarding",
          secondaryCtaText: "See consultation prices",
          secondaryCtaLink: "#pricing",
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
          badge: "Healthcare, made easy",
          titleLine1: "Your doctor is just a tap away",
          titleHighlightLine2: "trusted care, anytime",
          description:
            "MeetADoc connects you to licensed doctors for secure video consultations, prescriptions, and follow-up care — all from the comfort of your home.",
          primaryCtaText: "Get started in minutes",
          primaryCtaLink: "/onboarding",
          secondaryCtaText: "See available doctors",
          secondaryCtaLink: "/doctors",
        },
        cta: {
          title: "Ready to put your health first?",
          description:
            "Join thousands of people using MeetADoc to talk to doctors faster, without leaving home.",
          primaryCtaText: "Get started in minutes",
          primaryCtaLink: "/onboarding",
          secondaryCtaText: "See consultation prices",
          secondaryCtaLink: "#pricing",
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
