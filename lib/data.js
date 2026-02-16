import {
  Calendar,
  Video,
  CreditCard,
  User,
  FileText,
  ShieldCheck,
} from "lucide-react";

// JSON data for features
export const features = [
  {
    icon: <User className="h-6 w-6 text-emerald-400" />,
    title: "Create your MeetADoc account",
    description:
      "Sign up with your phone number or email and tell us a bit about your health needs.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-emerald-400" />,
    title: "Book at your own time",
    description:
      "See available doctors, compare profiles, and pick a time that fits your schedule.",
  },
  {
    icon: <Video className="h-6 w-6 text-emerald-400" />,
    title: "See a doctor on video",
    description:
      "Talk to licensed doctors on secure video calls without leaving your home.",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-emerald-400" />,
    title: "Pay once, use credits",
    description:
      "Buy consultation credits in Naira and use them across different doctors and specialties.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
    title: "Only verified doctors",
    description:
      "Every doctor is carefully vetted with their medical license and place of practice.",
  },
  {
    icon: <FileText className="h-6 w-6 text-emerald-400" />,
    title: "Your records in one place",
    description:
      "See your past consultations, doctor's notes, and follow-up plans anytime from your phone.",
  },
];

// JSON data for testimonials
export const testimonials = [
  {
    initials: "AO",
    name: "Amaka O.",
    role: "Patient in Lagos",
    quote:
      "I used to spend hours in traffic just to see a doctor. With MeetADoc I spoke to a doctor on video during my lunch break and got my prescription the same day.",
  },
  {
    initials: "DT",
    name: "Dr. Tunde A.",
    role: "General practitioner in Abuja",
    quote:
      "This platform makes it easier to follow up with my patients and reach people outside my hospital. Payments in Naira are smooth and consultations stay organised.",
  },
  {
    initials: "CU",
    name: "Chinedu U.",
    role: "Patient in Port Harcourt",
    quote:
      "The credit system works well for me. I load credits when I have money and use them later when someone in my family needs to talk to a doctor.",
  },
];

// JSON data for credit system benefits
export const creditBenefits = [
  "Each consultation requires <strong class='text-emerald-400'>2 credits</strong> regardless of duration",
  "Credits <strong class='text-emerald-400'>never expire</strong> - use them whenever you need",
  "Monthly subscriptions give you <strong class='text-emerald-400'>fresh credits every month</strong>",
  "Cancel or change your subscription <strong class='text-emerald-400'>anytime</strong> without penalties",
];
