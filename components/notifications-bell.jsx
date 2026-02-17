"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { markAllNotificationsRead, markNotificationRead, getUserNotifications } from "@/actions/notifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const POLL_INTERVAL_MS = 15000;

export default function NotificationsBell({ initialItems, initialUnreadCount }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems || []);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount || 0);
  const [hasMounted, setHasMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const lastSeenCreatedAtRef = useRef(
    initialItems && initialItems.length > 0
      ? new Date(initialItems[0].createdAt).getTime()
      : 0
  );
  const { loading, fn } = useFetch(markAllNotificationsRead);
  const { fn: markOne } = useFetch(markNotificationRead);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const onToggle = () => {
    setOpen((prev) => !prev);
  };

  const openItem = async (item) => {
    setSelectedItem(item);
    setModalOpen(true);
    setOpen(false);

    if (!item.read) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markOne(item.id);
      } catch {}
    }
  };

  const onMarkAllRead = async () => {
    await fn();
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    if (!hasMounted) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await getUserNotifications();
        if (!res || cancelled) return;

        const { items: freshItems, unreadCount: freshUnread } = res;

        if (freshItems && freshItems.length > 0) {
          const newestCreatedAt = new Date(freshItems[0].createdAt).getTime();
          const prevNewest = lastSeenCreatedAtRef.current;

          if (newestCreatedAt > prevNewest) {
            lastSeenCreatedAtRef.current = newestCreatedAt;
          }
        }

        setItems(freshItems || []);
        setUnreadCount(freshUnread || 0);
      } catch {}
    };

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [hasMounted, items]);

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
        <div className="fixed top-16 left-1/2 -translate-x-1/2 transform w-[calc(100vw-2rem)] max-w-xs sm:w-80 sm:max-w-none max-h-96 overflow-y-auto rounded-lg border border-emerald-900/30 bg-background/95 backdrop-blur-sm shadow-lg z-30">
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
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className={`w-full text-left rounded-md px-3 py-2 border text-xs transition-colors ${
                    item.read
                      ? "border-emerald-900/20 bg-background/40 text-muted-foreground hover:bg-background/70"
                      : "border-emerald-800/60 bg-emerald-900/30 text-white hover:bg-emerald-900/50"
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
                </button>
              ))
            )}
          </div>
        </div>
      )}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto border-emerald-900/40 bg-background/95">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg flex items-center justify-between gap-2">
                  <span className="truncate mr-2">{selectedItem.title}</span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-emerald-400">
                  {selectedItem.scope === "GLOBAL" ? "Announcement" : "Direct message"}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {selectedItem.body}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
