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
import CreditsConfig from "./credits-config";
import {
  getPendingDoctors,
  getVerifiedDoctors,
  getPendingPayouts,
} from "@/actions/admin";

export default async function AdminPage() {
  const results = await Promise.allSettled([
    getPendingDoctors(),
    getVerifiedDoctors(),
    getPendingPayouts(),
    getNewUsers(),
    getLeaderboards(),
    getSiteSettings(),
    getAnalytics(),
  ]);

  const pendingDoctorsData =
    results[0].status === "fulfilled" ? results[0].value : { doctors: [] };
  const verifiedDoctorsData =
    results[1].status === "fulfilled" ? results[1].value : { doctors: [] };
  const pendingPayoutsData =
    results[2].status === "fulfilled" ? results[2].value : { payouts: [] };
  const usersData =
    results[3].status === "fulfilled" ? results[3].value : { users: [] };
  const leadersData =
    results[4].status === "fulfilled" ? results[4].value : { patients: [], doctors: [] };
  const settings = results[5].status === "fulfilled" ? results[5].value : null;
  const analytics = results[6].status === "fulfilled" ? results[6].value : {};

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
        <div className="space-y-6">
          <NewUsers users={usersData.users || []} />
          <AnalyticsPanel stats={analytics || {}} />
        </div>
      </TabsContent>

      <TabsContent value="leaderboards" className="border-none p-0">
        <Leaderboards patients={leadersData.patients || []} doctors={leadersData.doctors || []} />
      </TabsContent>

      <TabsContent value="settings" className="border-none p-0">
        <div className="space-y-6">
          <SiteSettingsPanel initialSettings={settings || {}} />
          <CreditsConfig initialSettings={settings || {}} />
        </div>
      </TabsContent>
    </>
  );
}
