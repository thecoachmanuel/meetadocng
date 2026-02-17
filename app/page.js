import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Pricing from "@/components/pricing";
import { checkUser } from "@/lib/checkUser";
import { creditBenefits, features, testimonials } from "@/lib/data";
import { getSettings } from "@/lib/settings";

export default async function Home() {
	const [s, user] = await Promise.all([getSettings(), checkUser()]);

	const role = user?.role;
	const redirectMap = {
		ADMIN: "/admin",
		DOCTOR: "/doctor",
		PATIENT: "/appointments",
		UNASSIGNED: "/onboarding",
	};
	const dashboardHref = role ? redirectMap[role] || "/" : null;
	const authCtaHref = dashboardHref || "/sign-up";
  const hs = s.homepageSections || {};
  const dynamicSections = Array.isArray(hs.features) ? hs.features : Array.isArray(hs) ? hs : [];
  const hero = {
    badge: "Healthcare, made easy",
    titleLine1: "Your doctor is just a tap away",
    titleHighlightLine2: "trusted care, anytime",
    description:
      "MeetADoc connects you to licensed doctors for secure video consultations, prescriptions, and follow-up care — all from the comfort of your home.",
    primaryCtaText: "Get Started",
    primaryCtaLink: authCtaHref,
    secondaryCtaText: "Find Doctors",
    secondaryCtaLink: "/doctors",
  };
  const cta = hs.cta || {
    title: "Ready to take control of your healthcare?",
    description:
      "Join thousands of users who have simplified their healthcare journey with our platform. Get started today and experience healthcare the way it should be.",
    primaryCtaText: "Sign Up Now",
    primaryCtaLink: authCtaHref,
    secondaryCtaText: "View Pricing",
    secondaryCtaLink: "#pricing",
  };
  const creditBenefitsContent =
    Array.isArray(hs.creditBenefits) && hs.creditBenefits.length
      ? hs.creditBenefits
      : creditBenefits;
  const testimonialsData =
    Array.isArray(hs.testimonials) && hs.testimonials.length
      ? hs.testimonials
      : testimonials;
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-900/40 bg-background px-6 py-10 md:px-10 md:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <Badge
                  variant="outline"
                  className="bg-emerald-900/30 border-emerald-700/30 px-4 py-2 text-emerald-400 text-sm font-medium"
                >
                  {hero.badge}
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {hero.titleLine1} <br />
                  <span className="gradient-title">{hero.titleHighlightLine2}</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-md">
                  {hero.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Link href={hero.primaryCtaLink}>
                      {hero.primaryCtaText} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-emerald-700/30 hover:bg-muted/80"
                  >
                    <Link href={hero.secondaryCtaLink}>{hero.secondaryCtaText}</Link>
                  </Button>
                </div>
              </div>

              <div className="relative h-[320px] md:h-[380px] lg:h-[440px] rounded-2xl overflow-hidden border border-emerald-900/40 bg-emerald-950/40">
                <Image
                  src={s.heroImageUrl || "/banner2.png"}
                  alt="Doctor consultation"
                  fill
                  priority
                  className="object-cover md:pt-6 rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How MeetADoc Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Create your account, load consultation credits, and book a time that works for you. MeetADoc handles secure video, payments, and records so you can focus on feeling better.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(dynamicSections.length ? dynamicSections : features).map((feature, index) => (
              <Card
                key={index}
                className="relative bg-background/60 border-emerald-900/30 hover:border-emerald-700/50 hover:-translate-y-1 transition-all duration-300"
              >
                <CardHeader className="pb-3 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {feature.icon && (
                      <div className="h-10 w-10 rounded-full bg-emerald-900/40 flex items-center justify-center">
                        {feature.icon}
                      </div>
                    )}
                    <div className="text-xs uppercase tracking-wide text-emerald-400">
                      Step {index + 1}
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="bg-emerald-900/30 border-emerald-700/30 px-4 py-1 text-emerald-400 text-sm font-medium mb-4"
            >
              Affordable Healthcare
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Consultation Packages
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the perfect consultation package that fits your healthcare
              needs
            </p>
          </div>

          <div className="mx-auto grid gap-10 lg:grid-cols-2 lg:items-start">
				<div>
				  <Pricing
						userEmail={user?.email}
						userId={user?.id}
						rate={s.creditToNairaRate || 1000}
						freeCredits={s.freeCredits || 2}
						standardCredits={s.standardCredits || 10}
						premiumCredits={s.premiumCredits || 24}
					  />
				</div>
            <Card className="bg-muted/20 border-emerald-900/30 lg:mt-4">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-emerald-400" />
                  How Our Credit System Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 bg-emerald-900/20 p-1 rounded-full">
                      <svg
                        className="h-4 w-4 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <p className="text-muted-foreground">
                      Each video consultation uses {s.appointmentCreditCost || 2} credits (approximately ₦
                      {((s.appointmentCreditCost || 2) * (s.creditToNairaRate || 1000)).toLocaleString()}).
                    </p>
                  </li>
                  {creditBenefitsContent.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="mr-3 mt-1 bg-emerald-900/20 p-1 rounded-full">
                        <svg
                          className="h-4 w-4 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      </div>
                      <p
                        className="text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: benefit }}
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="bg-emerald-900/30 border-emerald-700/30 px-4 py-1 text-emerald-400 text-sm font-medium mb-4"
            >
              Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hear from patients and doctors who use our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonialsData.map((testimonial, index) => (
              <Card
                key={index}
                className="border-emerald-900/20 bg-background/60 hover:border-emerald-800/40 hover:bg-background transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-900/20 flex items-center justify-center mr-4">
                      <span className="text-emerald-400 font-bold">
                        {testimonial.initials}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with green medical styling */}
      <section className="relative z-0 py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-linear-to-r from-emerald-900/30 to-emerald-950/20 border-emerald-800/20">
            <CardContent className="p-8 md:p-12 lg:p-16 relative overflow-hidden">
              <div className="max-w-2xl relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  {cta.title}
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {cta.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Link href={cta.primaryCtaLink}>{cta.primaryCtaText}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-emerald-700/30 hover:bg-muted/80"
                  >
                    <Link href={cta.secondaryCtaLink}>{cta.secondaryCtaText}</Link>
                  </Button>
                </div>
              </div>

              {/* Decorative healthcare elements */}
              <div className="absolute right-0 top-0 w-[300px] h-[300px] bg-emerald-800/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute left-0 bottom-0 w-[200px] h-[200px] bg-emerald-700/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
