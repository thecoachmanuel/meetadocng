"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { createContactMessage } from "@/actions/contact";

export default function ContactPage() {
  const { data, loading, fn } = useFetch(createContactMessage);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (data?.success) {
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
      toast.success("Your message has been sent. We will get back to you soon.");
    }
  }, [data]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", name);
    fd.append("email", email);
    fd.append("phone", phone);
    fd.append("subject", subject);
    fd.append("message", message);
    await fn(fd);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8 text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold text-white">Contact us</h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          Have a question about your account, billing, or using MeetADoc? Send us a message and our team will get back to you.
        </p>
      </div>
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white">Send us a message</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Include country code if you are outside Nigeria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="How can we help?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share as many details as you can about your question or issue"
                className="min-h-[140px]"
                required
              />
            </div>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send message"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
