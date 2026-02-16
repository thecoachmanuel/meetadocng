import { TabsContent } from "@/components/ui/tabs";
import { PendingDoctors } from "./components/pending-doctors";
import { VerifiedDoctors } from "./components/verified-doctors";
import { PendingPayouts } from "./components/pending-payouts";
import { NewUsers, UserCreditsManager } from "./components/new-users";
import { AnnouncementsPanel } from "./components/announcements";
import { EnquiriesPanel } from "./components/enquiries";
import { Leaderboards } from "./components/leaderboards";
import { EscrowAppointments } from "./components/escrow-appointments";
import { getSiteSettings } from "@/actions/site-settings";
import { getNewUsers, getLeaderboards, getAnalytics, getContactMessages, getAnnouncements } from "@/actions/admin";
import AnalyticsPanel from "./analytics-panel";
import SiteSettingsPanel from "./settings-panel";
import CreditsConfig from "./credits-config";
import {
  getPendingDoctors,
  getVerifiedDoctors,
  getPendingPayouts,
  getEscrowAppointments,
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
    getEscrowAppointments(),
    getContactMessages(),
    getAnnouncements(),
  ]);

  const pendingDoctorsData =
    results[0].status === "fulfilled" && results[0].value
      ? results[0].value
      : { doctors: [] };
  const verifiedDoctorsData =
    results[1].status === "fulfilled" && results[1].value
      ? results[1].value
      : { doctors: [] };
  const pendingPayoutsData =
    results[2].status === "fulfilled" && results[2].value
      ? results[2].value
      : { payouts: [] };
  const usersData =
    results[3].status === "fulfilled" && results[3].value
      ? results[3].value
      : { users: [] };
  const leadersData =
    results[4].status === "fulfilled" && results[4].value
      ? results[4].value
      : { patients: [], doctors: [] };
  const settings =
    results[5].status === "fulfilled" && results[5].value
      ? results[5].value
      : null;
  const analytics =
    results[6].status === "fulfilled" && results[6].value
      ? results[6].value
      : {};
  const escrowData =
    results[7].status === "fulfilled" && results[7].value
      ? results[7].value
      : { appointments: [] };
  const contactData =
    results[8].status === "fulfilled" && results[8].value
      ? results[8].value
      : { messages: [] };
  const announcementsData =
    results[9].status === "fulfilled" && results[9].value
      ? results[9].value
      : { announcements: [] };

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
        <EscrowAppointments appointments={escrowData.appointments || []} />
      </TabsContent>

      <TabsContent value="users" className="border-none p-0">
        <div className="space-y-6">
          <NewUsers users={usersData.users || []} />
          <UserCreditsManager />
          <AnalyticsPanel stats={analytics || {}} />
          <EnquiriesPanel messages={contactData.messages || []} />
          <AnnouncementsPanel announcements={announcementsData.announcements || []} />
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
