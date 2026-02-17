"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Loader2, User as UserIcon } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { getSupportMessagesForUserId, sendSupportMessage } from "@/actions/support-chat";

const POLL_INTERVAL_MS = 5000;

export default function SupportChat({ initialData }) {
  const { currentUser, isAdmin, conversations: initialConversations, messages: initialMessages, activeUserId: initialActiveUserId } =
    initialData || {};

  const [conversations, setConversations] = useState(initialConversations || []);
  const [activeUserId, setActiveUserId] = useState(initialActiveUserId || null);
  const [messages, setMessages] = useState(initialMessages || []);
  const [body, setBody] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);

  const { loading: sending, fn: sendFn } = useFetch(sendSupportMessage);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!activeUserId) return;

    let cancelled = false;

    const loadInitial = async () => {
      setLoadingThread(true);
      try {
        const data = await getSupportMessagesForUserId(activeUserId);
        if (!cancelled) {
          setMessages(data || []);
        }
      } catch {}
      if (!cancelled) {
        setLoadingThread(false);
      }
    };

    const poll = async () => {
      try {
        const data = await getSupportMessagesForUserId(activeUserId);
        if (!cancelled) {
          setMessages(data || []);
        }
      } catch {}
    };

    loadInitial();
    const id = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeUserId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const onSend = async (e) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    if (isAdmin && !activeUserId) return;

    const fd = new FormData();
    fd.append("body", trimmed);
    if (isAdmin && activeUserId) {
      fd.append("targetUserId", activeUserId);
    }

    await sendFn(fd);
    setBody("");
  };

  const onSelectConversation = (userId) => {
    setActiveUserId(userId);
  };

  const title = isAdmin ? "Support Inbox" : "Chat with Support";
  const subtitle = isAdmin
    ? "Reply to patients and doctors in real time"
    : "Our support team is here to help you";

  const renderConversationList = () => {
    if (!isAdmin) return null;

    if (!conversations || conversations.length === 0) {
      return (
        <div className="text-sm text-muted-foreground px-3 py-2">
          No conversations yet.
        </div>
      );
    }

    return conversations.map((conv) => {
      const isActive = conv.user.id === activeUserId;
      const lastSnippet = conv.lastMessage?.body || "";
      const date = conv.lastMessage?.createdAt
        ? new Date(conv.lastMessage.createdAt).toLocaleString()
        : "";

      return (
        <button
          key={conv.user.id}
          type="button"
          onClick={() => onSelectConversation(conv.user.id)}
          className={`w-full text-left px-3 py-2 rounded-md border text-xs mb-1 transition-colors ${
            isActive
              ? "border-emerald-700 bg-emerald-900/40 text-white"
              : "border-emerald-900/40 bg-background/40 text-muted-foreground hover:bg-background/70"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-6 w-6 rounded-full bg-emerald-900/60 flex items-center justify-center text-[10px] text-emerald-300">
                <UserIcon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-xs text-white">
                  {conv.user.name || conv.user.email}
                </div>
                <div className="text-[10px] text-emerald-400 truncate">
                  {conv.user.role}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground whitespace-nowrap">
              {date}
            </div>
          </div>
          <div className="text-[11px] line-clamp-2 text-muted-foreground">
            {lastSnippet}
          </div>
        </button>
      );
    });
  };

  const renderMessages = () => {
    if (!messages || messages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          {loadingThread ? "Loading messages..." : "No messages yet. Start the conversation."}
        </div>
      );
    }

    return (
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.map((m) => {
          const isMine = m.fromId === currentUser.id;
          const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : "";

          return (
            <div
              key={m.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-xs shadow-sm border ${
                  isMine
                    ? "bg-emerald-600 text-black border-emerald-500"
                    : "bg-background/70 text-white border-emerald-900/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium truncate">
                    {isMine ? "You" : m.from?.name || m.from?.email || "User"}
                  </span>
                  <span className="text-[10px] text-emerald-100/80">
                    {time}
                  </span>
                </div>
                <div className="whitespace-pre-line leading-snug">
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-900/60 flex items-center justify-center text-emerald-300">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>
        <Badge className="bg-emerald-900/60 border-emerald-700/40 text-[11px]">
          Signed in as {currentUser.name || currentUser.email} ({currentUser.role})
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        {isAdmin && (
          <div className="md:col-span-1 border border-emerald-900/30 rounded-md p-2 bg-background/40 max-h-[420px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Conversations
              </span>
              <span className="text-[10px] text-muted-foreground">
                {conversations.length} users
              </span>
            </div>
            {renderConversationList()}
          </div>
        )}

        <div className={isAdmin ? "md:col-span-3 flex flex-col gap-3" : "md:col-span-4 flex flex-col gap-3"}>
          <div className="flex-1 min-h-[220px] max-h-[360px] border border-emerald-900/30 rounded-md bg-background/60 p-3 flex flex-col">
            {renderMessages()}
          </div>

          <form onSubmit={onSend} className="flex flex-col gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[80px] bg-background/60 border-emerald-900/30 text-sm"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                This chat is for support with your MeetADoc account and appointments.
              </p>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 min-w-[110px] flex items-center justify-center gap-2"
                disabled={sending || (!body.trim() || (isAdmin && !activeUserId))}
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Send</span>
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

