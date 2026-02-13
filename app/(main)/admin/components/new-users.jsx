"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function NewUsers({ users }) {
  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">New Users</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-muted-foreground">No new users.</div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{u.name || u.email}</div>
                  <div className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</div>
                </div>
                <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">
                  {u.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

