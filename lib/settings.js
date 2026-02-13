import { db } from "@/lib/prisma";

export async function getSettings() {
  try {
    const s = await db.siteSettings.findUnique({ where: { id: "singleton" } });
    return (
      s || {
        id: "singleton",
        siteTitle: "MeetADoc",
        logoUrl: "/logo-single.png",
        faviconUrl: "/logo.png",
        heroImageUrl: "/banner2.png",
        homepageSections: null,
        theme: "dark",
        appointmentCreditCost: 2,
        doctorEarningPerCredit: 8,
        creditToNairaRate: 1000,
        freeCredits: 2,
        standardCredits: 10,
        premiumCredits: 24,
      }
    );
  } catch {
    return {
      id: "singleton",
      siteTitle: "MeetADoc",
      logoUrl: "/logo-single.png",
      faviconUrl: "/logo.png",
      heroImageUrl: "/banner2.png",
      homepageSections: null,
      theme: "dark",
      appointmentCreditCost: 2,
      doctorEarningPerCredit: 8,
      creditToNairaRate: 1000,
      freeCredits: 2,
      standardCredits: 10,
      premiumCredits: 24,
    };
  }
}
