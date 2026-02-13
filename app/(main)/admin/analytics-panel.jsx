"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPanel({ stats }) {
  const { usersMonthlyCalls, usersAllTimeCalls, doctorsMonthlyEarnings, doctorsAllTimeEarnings } = stats || {};
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
              {usersMonthlyCalls.map((u) => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="text-white">{u.name || u.email}</div>
                  <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">{u.calls}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white font-medium mb-2">All Time</div>
            <div className="space-y-2">
              {usersAllTimeCalls.map((u) => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="text-white">{u.name || u.email}</div>
                  <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">{u.calls}</Badge>
                </div>
              ))}
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
              {doctorsMonthlyEarnings.map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="text-white">{d.name || d.email}</div>
                  <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">₦{d.naira} ({d.points} pts)</Badge>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white font-medium mb-2">All Time</div>
            <div className="space-y-2">
              {doctorsAllTimeEarnings.map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="text-white">{d.name || d.email}</div>
                  <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">₦{d.naira} ({d.points} pts)</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

