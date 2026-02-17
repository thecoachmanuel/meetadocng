import Link from "next/link";
import { ArrowLeft, HeartHandshake, ShieldCheck, Activity, Globe2, Users, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AboutPage() {
	return (
		<div className="container mx-auto px-4 py-12 space-y-12">
			<div className="flex justify-start mb-2">
				<Link
					href="/"
					className="flex items-center text-muted-foreground hover:text-white transition-colors text-sm"
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to home
				</Link>
			</div>

			<section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
				<div className="space-y-4">
					<Badge
						variant="outline"
						className="bg-emerald-900/30 border-emerald-700/30 px-4 py-1 text-emerald-400 text-xs font-medium"
					>
						About MeetADoc
					</Badge>
					<h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
						Building modern, accessible healthcare for everyday people
					</h1>
					<p className="text-base md:text-lg text-muted-foreground max-w-xl">
						MeetADoc connects patients to licensed doctors for secure video consultations,
						prescriptions, and follow-up care. Our goal is simple: make quality healthcare
						feel as easy as messaging a friend.
					</p>
					<div className="grid grid-cols-2 gap-4 max-w-md">
						<div className="rounded-lg border border-emerald-900/30 bg-emerald-950/40 px-4 py-3">
							<p className="text-xs text-muted-foreground">For patients</p>
							<p className="text-sm font-medium text-white mt-1">
								Book trusted doctors in minutes, without leaving home.
							</p>
						</div>
						<div className="rounded-lg border border-emerald-900/30 bg-emerald-950/40 px-4 py-3">
							<p className="text-xs text-muted-foreground">For doctors</p>
							<p className="text-sm font-medium text-white mt-1">
								Grow your practice with flexible, online consultations.
							</p>
						</div>
					</div>
				</div>
				<div className="grid gap-4">
					<Card className="bg-emerald-950/40 border-emerald-900/40">
						<CardContent className="p-4 flex items-center justify-between">
							<div>
								<p className="text-xs text-muted-foreground">Consultations powered</p>
								<p className="text-2xl font-bold text-white">Anytime, anywhere</p>
							</div>
							<HeartHandshake className="h-8 w-8 text-emerald-400" />
						</CardContent>
					</Card>
					<div className="grid grid-cols-2 gap-4 text-xs">
						<div className="rounded-lg border border-emerald-900/30 bg-muted/10 p-3 flex items-center gap-3">
							<Clock3 className="h-5 w-5 text-emerald-400" />
							<div>
								<p className="text-muted-foreground">Faster access</p>
								<p className="text-white font-medium">Skip traffic & waiting rooms</p>
							</div>
						</div>
						<div className="rounded-lg border border-emerald-900/30 bg-muted/10 p-3 flex items-center gap-3">
							<Globe2 className="h-5 w-5 text-emerald-400" />
							<div>
								<p className="text-muted-foreground">Built for Nigeria</p>
								<p className="text-white font-medium">Optimized for local realities</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-6 md:grid-cols-3">
				<Card className="bg-muted/20 border-emerald-900/20">
					<CardHeader className="flex flex-row items-center gap-3 pb-3">
						<Users className="h-5 w-5 text-emerald-400" />
						<CardTitle className="text-base text-white">For patients</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground space-y-2">
						<p>Browse verified doctors by specialty and availability.</p>
						<p>Join video consultations from your phone, tablet, or laptop.</p>
						<p>Keep your appointments, notes, and credits in one place.</p>
					</CardContent>
				</Card>
				<Card className="bg-muted/20 border-emerald-900/20">
					<CardHeader className="flex flex-row items-center gap-3 pb-3">
						<Activity className="h-5 w-5 text-emerald-400" />
						<CardTitle className="text-base text-white">For doctors</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground space-y-2">
						<p>Showcase your expertise with a professional profile and verified status.</p>
						<p>Control your schedule, set availability, and see upcoming appointments at a glance.</p>
						<p>Earn through a transparent credit system with clear payout history.</p>
					</CardContent>
				</Card>
				<Card className="bg-muted/20 border-emerald-900/20">
					<CardHeader className="flex flex-row items-center gap-3 pb-3">
						<ShieldCheck className="h-5 w-5 text-emerald-400" />
						<CardTitle className="text-base text-white">Our promise</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground space-y-2">
						<p>Secure, encrypted consultations powered by modern infrastructure.</p>
						<p>Clear pricing, no hidden fees, and a simple way to understand credits.</p>
						<p>Human support when something doesn&apos;t go as planned.</p>
					</CardContent>
				</Card>
			</section>

			<section className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-start">
				<div className="space-y-4">
					<h2 className="text-xl md:text-2xl font-semibold text-white">
						How MeetADoc fits into your day
					</h2>
					<p className="text-sm md:text-base text-muted-foreground">
						We designed MeetADoc for people who are busy, live far from hospitals, or
						want a simpler way to follow up with trusted professionals. Every part of the
						product is shaped around real-life constraints: traffic, network quality, and
						busy schedules.
					</p>
					<ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
						<li>Book appointments when it&apos;s convenient, including evenings and weekends.</li>
						<li>Join from low-bandwidth connections with video tuned for Nigerian networks.</li>
						<li>Use credits instead of repeatedly entering card details for each visit.</li>
					</ul>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<Card className="bg-muted/15 border-emerald-900/20">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-white">Our focus</CardTitle>
						</CardHeader>
						<CardContent className="text-xs md:text-sm text-muted-foreground space-y-1">
							<p>Primary care, follow-ups, mental health, and everyday health questions.</p>
							<p>We are not an emergency service and always direct urgent cases to hospitals.</p>
						</CardContent>
					</Card>
					<Card className="bg-muted/15 border-emerald-900/20">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-white">Where we&apos;re headed</CardTitle>
						</CardHeader>
						<CardContent className="text-xs md:text-sm text-muted-foreground space-y-1">
							<p>Deeper integrations with pharmacies, labs, and diagnostics.</p>
							<p>Smarter routing so each patient sees the right doctor faster.</p>
						</CardContent>
					</Card>
				</div>
			</section>

			<section className="max-w-3xl mx-auto text-xs md:text-sm text-muted-foreground space-y-3">
				<p>
					Whether you are managing a long-term condition or just need quick advice,
					MeetADoc is here to make healthcare feel less intimidating and more human.
				</p>
				<p>
					If you have questions, feedback, or partnership ideas, our team would love to
					hear from you through the Contact us page.
				</p>
			</section>
		</div>
	);
}
