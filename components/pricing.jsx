"use client";

import React from "react";
import { Card, CardContent } from "./ui/card";
import Script from "next/script";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { purchaseCredits } from "@/actions/credits";
import { useRouter } from "next/navigation";

const Pricing = ({ userEmail, userId, rate = 1000, freeCredits = 2, standardCredits = 10, premiumCredits = 24 }) => {
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const router = useRouter();

  const startPayment = async (plan) => {
    if (!userId || !userEmail) {
      toast.error("Sign in to purchase credits");
      return;
    }
    if (!paystackKey || !window.PaystackPop) {
      toast.error("Payment system not available");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: userEmail,
      amount: plan.price * 100,
      currency: "NGN",
      metadata: {
        userId,
        plan: plan.id,
      },
      callback: async (response) => {
        if (!response?.reference) {
          toast.error("Payment reference missing, please contact support.");
          return;
        }
        toast.info("Verifying payment...");
        try {
          const res = await fetch("/api/paystack/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reference: response.reference }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.success) {
            toast.error(data?.error || "Unable to verify payment. Please contact support.");
            return;
          }
          toast.success("Payment verified. Credits added to your account.");
          router.refresh();
        } catch (error) {
          toast.error("An error occurred while verifying payment.");
        }
      },
      onClose: () => {
        toast.info("Payment window closed");
      },
    });

    handler.openIframe();
  };

  const plans = [
    { id: "free_user", name: "Free", price: 0, credits: freeCredits },
    { id: "standard", name: "Standard", price: standardCredits * rate, credits: standardCredits },
    { id: "premium", name: "Premium", price: premiumCredits * rate, credits: premiumCredits },
  ];

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" />
      <Card className="border-emerald-900/30 shadow-lg bg-gradient-to-b from-emerald-950/30 to-transparent">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="border border-emerald-900/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.credits} credits</p>
                <div className="text-3xl font-bold text-emerald-400 mb-6">
                  {plan.price === 0 ? "Free" : `₦${Math.round(plan.price).toLocaleString()}`}
                </div>
                {plan.price === 0 ? (
                  <Button disabled variant="outline">Included</Button>
                ) : (
                  <Button onClick={() => startPayment(plan)} className="bg-emerald-600 hover:bg-emerald-700">
                    Buy Credits
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default Pricing;
