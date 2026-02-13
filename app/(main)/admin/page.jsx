import { TabsContent } from "@/components/ui/tabs";
import { PendingDoctors } from "./components/pending-doctors";
import { VerifiedDoctors } from "./components/verified-doctors";
import { PendingPayouts } from "./components/pending-payouts";
import { NewUsers } from "./components/new-users";
import { Leaderboards } from "./components/leaderboards";
import { getSiteSettings } from "@/actions/site-settings";
import { getNewUsers, getLeaderboards, getAnalytics } from "@/actions/admin";
import AnalyticsPanel from "./analytics-panel";
import SiteSettingsPanel from "./settings-panel";
import ThemePanel from "./theme-panel";
import CreditsConfig from "./credits-config";
import {
  getPendingDoctors,
  getVerifiedDoctors,
  getPendingPayouts,
} from "@/actions/admin";

export default async function AdminPage() {
  // Fetch all data in parallel
  const [pendingDoctorsData, verifiedDoctorsData, pendingPayoutsData, usersData, leadersData, settings, analytics] =
    await Promise.all([
      getPendingDoctors(),
      getVerifiedDoctors(),
      getPendingPayouts(),
      getNewUsers(),
      getLeaderboards(),
      getSiteSettings(),
      getAnalytics(),
    ]);

  return (
    <>
      <TabsContent value="pending" className="border-none p-0">
        <PendingDoctors doctors={pendingDoctorsData.doctors || []} />
      </TabsContent>

      <TabsContent value="doctors" className="border-none p-0">
        <VerifiedDoctors doctors={verifiedDoctorsData.doctors || []} />
      </TabsContent>

      <TabsContent value="payouts" className="border-none p-0">
        <PendingPayouts payouts={pendingPayoutsData.payouts || []} />
      </TabsContent>

      <TabsContent value="users" className="border-none p-0">
        <NewUsers users={usersData.users || []} />
      </TabsContent>

      <TabsContent value="leaderboards" className="border-none p-0">
        <Leaderboards patients={leadersData.patients || []} doctors={leadersData.doctors || []} />
      </TabsContent>

      <TabsContent value="users" className="border-none p-0">
        <div className="space-y-6">
          <NewUsers users={usersData.users || []} />
          <AnalyticsPanel stats={analytics || {}} />
        </div>
      </TabsContent>

      <TabsContent value="settings" className="border-none p-0">
        <div className="space-y-6">
          <SiteSettingsPanel initialSettings={settings || {}} />
          <CreditsConfig initialSettings={settings || {}} />
        </div>
      </TabsContent>

      <TabsContent value="theme" className="border-none p-0">
        <ThemePanel initialTheme={(settings?.theme) || "dark"} />
      </TabsContent>
    </>
  );
}
