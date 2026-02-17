import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AboutPage() {
	return (
		<div className="container mx-auto px-4 py-12">
			<div className="flex justify-start mb-4">
				<Link
					href="/"
					className="flex items-center text-muted-foreground hover:text-white transition-colors text-sm"
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to home
				</Link>
			</div>

			<div className="max-w-3xl mx-auto mb-10 text-center">
				<Badge
					variant="outline"
					className="bg-emerald-900/30 border-emerald-700/30 px-4 py-1 text-emerald-400 text-sm font-medium mb-4"
				>
					About MeetADoc
				</Badge>
				<h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
					Your trusted partner for modern healthcare
				</h1>
				<p className="text-lg text-muted-foreground">
					MeetADoc connects patients to licensed doctors for fast, secure video
					consultations, prescriptions, and follow-up care without leaving home.
				</p>
			</div>

			<div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3 mb-10">
				<Card className="bg-muted/20 border-emerald-900/20">
					<CardHeader>
						<CardTitle className="text-base text-white">For patients</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground space-y-2">
						<p>Book appointments in minutes and speak with doctors on your schedule.</p>
						<p>Keep your medical history, prescriptions, and follow-ups in one place.</p>
					</CardContent>
				</Card>
				<Card className="bg-muted/20 border-emerald-900/20">
					<CardHeader>
						<CardTitle className="text-base text-white">For doctors</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground space-y-2">
						<p>Grow your practice with online consultations and flexible availability.</p>
						<p>Get paid securely while focusing on delivering quality care to patients.</p>
					</CardContent>
				</Card>
				<Card className="bg-muted/20 border-emerald-900/20">
					<CardHeader>
						<CardTitle className="text-base text-white">Our promise</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground space-y-2">
						<p>Secure, confidential consultations built on trusted infrastructure.</p>
						<p>Transparent pricing and a simple experience for every user.</p>
					</CardContent>
				</Card>
			</div>

			<div className="max-w-3xl mx-auto text-muted-foreground text-sm space-y-4">
				<p>
					Whether you are managing a long-term condition or need quick advice from a
					licensed professional, MeetADoc helps you get care without waiting rooms or
					travel time.
				</p>
				<p>
					Our platform is designed for Nigeria and emerging markets, with reliable
					video calls, simple payments, and an experience that works on everyday
					devices.
				</p>
				<p>
					If you have questions, feedback, or partnership ideas, we would love to
					hear from you on the Contact us page.
				</p>
			</div>
		</div>
	);
}

