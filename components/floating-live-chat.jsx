"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Loader2, Mail, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SupportChat from "@/app/(main)/support/support-chat";
import useFetch from "@/hooks/use-fetch";
import { createContactMessage } from "@/actions/contact";

export default function FloatingLiveChat({ supportData }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const hasUser = !!supportData?.currentUser;

  const { loading, fn: sendGuestMessage } = useFetch(createContactMessage);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const onSubmitGuest = async (e) => {
    e.preventDefault();
    const name = guestName.trim();
    const email = guestEmail.trim();
    const message = guestMessage.trim();
    if (!name || !email || !message) return;

    const fd = new FormData();
    fd.append("name", name);
    fd.append("email", email);
    fd.append("subject", "Live chat message");
    fd.append("message", message);

    await sendGuestMessage(fd);
    setSent(true);
    setGuestMessage("");
  };

  const renderGuestContent = () => {
    if (sent) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-900/60 flex items-center justify-center text-emerald-300">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Message sent to support</p>
            <p className="text-xs text-muted-foreground mt-1">
              Our team will get back to you shortly via email.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-700/50 text-emerald-200 hover:bg-emerald-900/40"
            onClick={() => setSent(false)}
          >
            Send another message
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={onSubmitGuest} className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Badge className="bg-emerald-900/60 border-emerald-700/40 text-[10px] flex items-center gap-1">
            <UserIcon className="h-3 w-3" />
            Guest chat
          </Badge>
          <span>Ask anything about MeetADoc, no account required.</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserIcon className="h-3.5 w-3.5 text-emerald-300" />
            <Input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="h-9 bg-background/60 border-emerald-900/40 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-emerald-300" />
            <Input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Your email address"
              className="h-9 bg-background/60 border-emerald-900/40 text-xs"
            />
          </div>
        </div>
        <Textarea
          value={guestMessage}
          onChange={(e) => setGuestMessage(e.target.value)}
          placeholder="Type your question here..."
          className="min-h-[80px] bg-background/60 border-emerald-900/40 text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            Messages go directly to the MeetADoc support team.
          </p>
          <Button
            type="submit"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 min-w-[110px] flex items-center justify-center gap-2"
            disabled={loading || !guestName.trim() || !guestEmail.trim() || !guestMessage.trim()}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span className="text-xs">Send</span>
          </Button>
        </div>
      </form>
    );
  };

  return (
    <>
      <div
        className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:right-6"
        aria-live="polite"
      >
        {open && (
          <div
            ref={panelRef}
            className="w-[min(100vw-2rem,360px)] shadow-xl rounded-xl border border-emerald-900/40 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-900/60 flex items-center justify-center text-emerald-300">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-white">
                      Live chat support
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Talk to the MeetADoc team in real time.
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-white"
                  onClick={() => setOpen(false)}
                  aria-label="Close live chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                  {hasUser ? (
                    <SupportChat initialData={supportData} />
                  ) : (
                    renderGuestContent()
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Button
          type="button"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-emerald-50 flex items-center justify-center border border-emerald-400/40"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close live chat" : "Open live chat"}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}

