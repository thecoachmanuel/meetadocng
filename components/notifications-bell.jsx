"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { markAllNotificationsRead } from "@/actions/notifications";

export default function NotificationsBell({ initialItems, initialUnreadCount }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems || []);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount || 0);
  const { loading, fn } = useFetch(markAllNotificationsRead);

  const onToggle = () => {
    setOpen((prev) => !prev);
  };

  const onMarkAllRead = async () => {
    await fn();
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        className="w-10 h-10 p-0 relative"
        onClick={onToggle}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-black px-1.5 py-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
		{open && (
			<div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] max-h-96 overflow-y-auto rounded-lg border border-emerald-900/30 bg-background/95 backdrop-blur-sm shadow-lg z-30">
          <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-900/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Notifications
            </span>
            <button
              type="button"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
              onClick={onMarkAllRead}
              disabled={loading || unreadCount === 0}
            >
              Mark all read
            </button>
          </div>
          <div className="p-3 space-y-2">
            {items.length === 0 ? (
              <div className="text-xs text-muted-foreground">
                You have no notifications.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-md px-3 py-2 border text-xs ${
                    item.read
                      ? "border-emerald-900/20 bg-background/40 text-muted-foreground"
                      : "border-emerald-800/60 bg-emerald-900/30 text-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium truncate max-w-[70%]">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-[11px] leading-snug line-clamp-3 whitespace-pre-line">
                    {item.body}
                  </div>
                  <div className="mt-1 text-[10px] text-emerald-400">
                    {item.scope === "GLOBAL" ? "Announcement" : "Direct message"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
