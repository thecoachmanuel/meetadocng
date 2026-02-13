import { verifyAdmin } from "@/actions/admin";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, AlertCircle, Users, CreditCard, Layout, Palette } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Admin Settings - MeetADoc",
  description: "Manage doctors, patients, and platform settings",
};

export default async function AdminLayout({ children }) {
  // Verify the user has admin access
  const isAdmin = await verifyAdmin();

  // Redirect if not an admin
  if (!isAdmin) {
    redirect("/onboarding");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader icon={<ShieldCheck />} title="Admin Settings" />

      {/* Vertical tabs on larger screens / Horizontal tabs on mobile */}
      <Tabs
        defaultValue="pending"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <TabsList className="md:col-span-1 bg-muted/30 border h-auto md:h-40 flex sm:flex-row md:flex-col w-full p-2 md:p-1 rounded-md md:space-y-2 sm:space-x-2 md:space-x-0 overflow-x-auto sm:overflow-x-auto md:overflow-visible whitespace-nowrap scroll-smooth">
          <TabsTrigger
            value="pending"
            className="shrink-0 md:flex md:items-center md:justify-start md:px-4 md:py-3 px-3 py-2"
          >
            <AlertCircle className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Pending Verification</span>
          </TabsTrigger>
          <TabsTrigger
            value="doctors"
            className="shrink-0 md:flex md:items-center md:justify-start md:px-4 md:py-3 px-3 py-2"
          >
            <Users className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Doctors</span>
          </TabsTrigger>
          <TabsTrigger
            value="payouts"
            className="shrink-0 md:flex md:items-center md:justify-start md:px-4 md:py-3 px-3 py-2"
          >
            <CreditCard className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Payouts</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="shrink-0 md:flex md:items-center md:justify-start md:px-4 md:py-3 px-3 py-2">
            <Users className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboards" className="shrink-0 md:flex md:items-center md:justify-start md:px-4 md:py-3 px-3 py-2">
            <Layout className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Leaderboards</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="shrink-0 md:flex md:items-center md:justify-start md:px-4 md:py-3 px-3 py-2">
            <Layout className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Site Settings</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="shrink-0 md:flex md:items-center md:justify-start md:px-4 md:py-3 px-3 py-2">
            <Palette className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Theme</span>
          </TabsTrigger>
        </TabsList>
        <div className="md:col-span-3">{children}</div>
      </Tabs>
    </div>
  );
}
