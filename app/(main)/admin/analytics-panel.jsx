"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/currency";

export default function AnalyticsPanel({ stats }) {
  const {
    usersMonthlyCalls = [],
    usersAllTimeCalls = [],
    doctorsMonthlyEarnings = [],
    doctorsAllTimeEarnings = [],
    adminResolutions = [],
    platformFees = {},
  } = stats || {};

  const {
    totalThisMonth = 0,
    totalAllTime = 0,
    timeline = [],
  } = platformFees || {};
  return (
    <div className="space-y-6">
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Users Calls</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-white font-medium mb-2">This Month</div>
            <div className="space-y-2">
              {(usersMonthlyCalls || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No data available</div>
              ) : (
                usersMonthlyCalls.map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="text-white">{u.name || u.email}</div>
                    <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">{u.calls}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="text-white font-medium mb-2">All Time</div>
            <div className="space-y-2">
              {(usersAllTimeCalls || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No data available</div>
              ) : (
                usersAllTimeCalls.map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="text-white">{u.name || u.email}</div>
                    <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">{u.calls}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Doctors Earnings</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-white font-medium mb-2">This Month</div>
            <div className="space-y-2">
              {(doctorsMonthlyEarnings || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No data available</div>
              ) : (
                doctorsMonthlyEarnings.map((d) => (
                  <div key={d.id} className="flex items-center justify-between">
                    <div className="text-white">{d.name || d.email}</div>
                    <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">₦{d.naira} ({d.points} pts)</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="text-white font-medium mb-2">All Time</div>
            <div className="space-y-2">
              {(doctorsAllTimeEarnings || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No data available</div>
              ) : (
                doctorsAllTimeEarnings.map((d) => (
                  <div key={d.id} className="flex items-center justify-between">
                    <div className="text-white">{d.name || d.email}</div>
                    <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">₦{d.naira} ({d.points} pts)</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Platform Fees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-white font-medium mb-1">This Month</div>
              <div className="text-2xl font-bold text-white">{formatNaira(totalThisMonth)}</div>
              <div className="text-xs text-muted-foreground mt-1">Total platform fees from processed payouts this month</div>
            </div>
            <div>
              <div className="text-white font-medium mb-1">All Time</div>
              <div className="text-2xl font-bold text-white">{formatNaira(totalAllTime)}</div>
              <div className="text-xs text-muted-foreground mt-1">Cumulative platform fees from all processed payouts</div>
            </div>
          </div>

          <div>
            <div className="text-white font-medium mb-2">Recent Periods</div>
            {(timeline || []).length === 0 ? (
              <div className="text-sm text-muted-foreground">No payout data available</div>
            ) : (
              <div className="space-y-2">
                {timeline.map((row) => (
                  <div
                    key={row.month}
                    className="flex items-center justify-between text-sm border border-emerald-900/20 rounded-md px-3 py-2 bg-background/40"
                  >
                    <div className="text-white">
                      {row.month}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                      >
                        {formatNaira(row.platformFee)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Gross {formatNaira(row.grossAmount)} • Net {formatNaira(row.netAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">
            Recent Escrow Decisions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(adminResolutions || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No escrow decisions recorded yet.
            </div>
          ) : (
            adminResolutions.slice(0, 6).map((r) => (
              <div
                key={r.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-2 border border-emerald-900/20 rounded-md px-3 py-2 bg-background/40"
              >
                <div className="space-y-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-white font-medium">
                      Dr. {r.doctor?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ↔ {r.patient?.name || "Unknown"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xl line-clamp-2">
                    {r.note}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <Badge
                    variant="outline"
                    className={
                      r.decision === "REFUNDED"
                        ? "bg-rose-900/20 border-rose-900/30 text-rose-400"
                        : "bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                    }
                  >
                    {r.decision}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-muted/10 border-muted/30 text-xs text-muted-foreground"
                  >
                    {new Date(r.updatedAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
