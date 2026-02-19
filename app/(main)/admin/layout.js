import { getAdminProfile } from "@/actions/admin";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, AlertCircle, Users, CreditCard, Layout } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Admin Settings - MeetADoc",
  description: "Manage doctors, patients, and platform settings",
};

const adminTabs = [
  {
    value: "pending",
    label: "Pending Verification",
    icon: AlertCircle,
  },
  {
    value: "doctors",
    label: "Doctors",
    icon: Users,
  },
  {
    value: "payouts",
    label: "Payouts",
    icon: CreditCard,
  },
  {
    value: "payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    value: "users",
    label: "Users",
    icon: Users,
  },
  {
    value: "roles",
    label: "Admin Roles",
    icon: ShieldCheck,
  },
  {
    value: "leaderboards",
    label: "Leaderboards",
    icon: Layout,
  },
  {
    value: "settings",
    label: "Site Settings",
    icon: Layout,
  },
];

export default async function AdminLayout({ children }) {
  const profile = await getAdminProfile();

	if (!profile.isAdmin) {
		if (!profile.id) {
			redirect("/sign-in");
		}
		redirect("/");
	}

  const tabsForRole = adminTabs.filter((tab) =>
    profile.isMainAdmin ? true : tab.value !== "roles",
  );

  const allowedTabs =
    profile.isMainAdmin || !profile.allowedSections.length
      ? tabsForRole
      : tabsForRole.filter((tab) => profile.allowedSections.includes(tab.value));

  const defaultTab = allowedTabs[0]?.value || tabsForRole[0].value;

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader icon={<ShieldCheck />} title="Admin Settings" />

      <Tabs
        defaultValue={defaultTab}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start"
      >
        <TabsList className="md:col-span-1 bg-muted/30 border h-auto flex flex-row md:flex-col w-full max-w-full p-2 md:p-1 rounded-xl md:space-y-2 space-x-2 md:space-x-0 overflow-x-auto whitespace-nowrap md:whitespace-normal scroll-smooth">
          {allowedTabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="shrink-0 md:flex md:items-center md:justify-start md:px-4 md:py-3 px-3 py-2"
              >
                <Icon className="h-4 w-4 mr-2 hidden md:inline" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        <div className="md:col-span-3">{children}</div>
      </Tabs>
    </div>
  );
}
