import AnalyticsPanel from "../analytics-panel";
import { getAnalytics } from "@/actions/admin";

export const metadata = {
  title: "Admin Analytics Report",
};

export default async function AnalyticsReportPage() {
  const stats = await getAnalytics();

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics Report</h1>
            <p className="text-sm text-muted-foreground">
              Printable summary of usage, earnings, and platform performance.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Generated on {new Date().toLocaleString()}
          </div>
        </header>

        <AnalyticsPanel stats={stats} />
      </div>
    </div>
  );
}

