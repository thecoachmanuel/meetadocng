"use client";

import React from "react";
import { Card, CardContent } from "./ui/card";
import Script from "next/script";
import { Button } from "./ui/button";
import { toast } from "sonner";

const plans = [
  { id: "free_user", name: "Free", price: 0, credits: 0 },
  { id: "standard", name: "Standard", price: 5000, credits: 10 },
  { id: "premium", name: "Premium", price: 12000, credits: 24 },
];

const Pricing = ({ userEmail, userId }) => {
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

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
        toast.success("Payment successful. Credits will be added shortly.");
      },
      onClose: () => {
        toast.info("Payment window closed");
      },
    });

    handler.openIframe();
  };

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
                  {plan.price === 0 ? "Free" : `₦${plan.price.toLocaleString()}`}
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
