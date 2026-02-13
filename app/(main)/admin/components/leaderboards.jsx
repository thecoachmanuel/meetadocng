"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Leaderboards({ patients, doctors }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Top Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patients.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{p.name || p.email}</div>
                  <div className="text-xs text-muted-foreground">Rank #{i + 1}</div>
                </div>
                <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">
                  {p.credits} credits
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Top Doctors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {doctors.map((d, i) => (
              <div key={d.id} className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{d.name || d.email}</div>
                  <div className="text-xs text-muted-foreground">{d.specialty} • Rank #{i + 1}</div>
                </div>
                <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">
                  {d.credits} credits
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

