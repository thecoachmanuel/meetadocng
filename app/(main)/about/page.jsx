import Link from "next/link";
import { ArrowLeft, HeartHandshake, ShieldCheck, Activity, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AboutPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-12 space-y-10">
			<div className="flex justify-start mb-2">
				<Link
					href="/"
					className="flex items-center text-muted-foreground hover:text-white transition-colors text-sm"
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to home
				</Link>
			</div>

			<div className="text-center space-y-3">
				<Badge
					variant="outline"
					className="bg-emerald-950/40 border-emerald-700/40 text-emerald-300 text-[11px] tracking-wide"
				>
					About us
				</Badge>
				<h1 className="text-3xl md:text-4xl font-semibold md:font-bold text-white">
					Built for calm, clear healthcare conversations
				</h1>
				<p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
					MeetADoc connects patients and doctors in a simple, modern space where appointments
					are easy to book, video calls are reliable, and support is always within reach.
				</p>
			</div>

			<Card className="bg-gradient-to-br from-emerald-950/80 via-background to-slate-950 border-emerald-900/40">
				<CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-8">
					<div className="space-y-4 flex-1">
						<h2 className="text-xl md:text-2xl font-semibold text-white">
							Healthcare that fits real life
						</h2>
						<p className="text-sm md:text-base text-muted-foreground max-w-xl">
							No hospital queues, no confusing portals. Just secure video calls, clear
							appointments, and a friendly credit system that keeps pricing transparent.
						</p>
						<div className="flex flex-wrap gap-3 pt-1">
							<Badge className="bg-emerald-900/60 text-emerald-50 border-emerald-700/60 text-[11px] px-3 py-1">
								For patients: quick, friendly care
							</Badge>
							<Badge
								variant="outline"
								className="border-emerald-800/60 text-emerald-100 text-[11px] px-3 py-1"
							>
								For doctors: flexible online practice
							</Badge>
						</div>
					</div>
					<div className="flex justify-center md:justify-end flex-1">
						<div className="relative inline-flex items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-800/60 p-4 md:p-5">
							<div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl" />
							<HeartHandshake className="relative h-9 w-9 md:h-11 md:w-11 text-emerald-300" />
						</div>
					</div>
				</CardContent>
			</Card>

			<section className="grid gap-5 md:grid-cols-3">
				<Card className="bg-muted/15 border-emerald-900/25">
					<CardHeader className="flex flex-row items-center gap-3 pb-2">
						<div className="rounded-full bg-emerald-950/60 border border-emerald-900/40 p-2">
							<Users className="h-4 w-4 text-emerald-300" />
						</div>
						<CardTitle className="text-base md:text-lg font-semibold text-white">
							For patients
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm md:text-base text-muted-foreground space-y-1.5">
						<p>Find trusted doctors by specialty and time that works for you.</p>
						<p>Join secure video calls from your phone or laptop in a few taps.</p>
						<p>Keep your visits, notes, and credits together in one simple place.</p>
					</CardContent>
				</Card>
				<Card className="bg-muted/15 border-emerald-900/25">
					<CardHeader className="flex flex-row items-center gap-3 pb-2">
						<div className="rounded-full bg-emerald-950/60 border border-emerald-900/40 p-2">
							<Activity className="h-4 w-4 text-emerald-300" />
						</div>
						<CardTitle className="text-base md:text-lg font-semibold text-white">
							For doctors
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm md:text-base text-muted-foreground space-y-1.5">
						<p>Create a clear, professional profile your patients can trust.</p>
						<p>Set your own availability and see upcoming appointments at a glance.</p>
						<p>Get paid through a transparent credit system and simple payouts.</p>
					</CardContent>
				</Card>
				<Card className="bg-muted/15 border-emerald-900/25">
					<CardHeader className="flex flex-row items-center gap-3 pb-2">
						<div className="rounded-full bg-emerald-950/60 border border-emerald-900/40 p-2">
							<ShieldCheck className="h-4 w-4 text-emerald-300" />
						</div>
						<CardTitle className="text-base md:text-lg font-semibold text-white">
							Our promise
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm md:text-base text-muted-foreground space-y-1.5">
						<p>Secure, encrypted calls so your health conversations stay private.</p>
						<p>Clear pricing with no surprise fees or tricky terms.</p>
						<p>Real people behind the product when you need a little extra help.</p>
					</CardContent>
				</Card>
			</section>

			<section className="max-w-3xl mx-auto">
				<Card className="bg-muted/10 border-emerald-900/25">
					<CardContent className="p-5 md:p-6 space-y-3 text-sm md:text-base text-muted-foreground">
						<p>
							Whether you&apos;re checking in about something small or managing a long-term
								condition, MeetADoc is here to make getting care feel calmer and more
								personal.
						</p>
						<p>
							Have questions, feedback, or partnership ideas? You can always reach us
								through the Contact page – we&apos;d love to hear from you.
						</p>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
