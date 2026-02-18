"use client";

import React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const Pricing = ({ userEmail, userId, rate = 1000, freeCredits = 2, standardCredits = 10, premiumCredits = 50 }) => {
	const router = useRouter();
	const isAuthenticatedPatient = Boolean(userId && userEmail);
	const canPurchase = isAuthenticatedPatient;

	const startPayment = async (plan) => {
		if (!userId || !userEmail) {
			toast.error("Sign in as a patient to purchase credits");
			return;
		}
		const amountInKobo = Math.round(plan.price * 100);
		try {
			toast.info("Redirecting to secure Paystack checkout...");
			const res = await fetch("/api/paystack/init", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: userEmail,
					userId,
					plan: plan.id,
					amount: amountInKobo,
				}),
			});
			const data = await res.json().catch(() => null);
			if (!res.ok || !data?.authorizationUrl) {
				toast.error(data?.error || "Unable to start payment, please contact support.");
				return;
			}
			window.location.href = data.authorizationUrl;
		} catch (error) {
			toast.error("Could not connect to payment service.");
		}
  };

  const plans = [
    { id: "free_user", name: "Free", price: 0, credits: freeCredits },
    { id: "standard", name: "Standard", price: standardCredits * rate, credits: standardCredits },
    { id: "premium", name: "Premium", price: premiumCredits * rate, credits: premiumCredits },
  ];

	return (
		<>
	      <Card className="border-emerald-900/30 shadow-lg bg-linear-to-b from-emerald-950/30 to-transparent">
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
									<>
										<Button
											onClick={() => startPayment(plan)}
											className="bg-emerald-600 hover:bg-emerald-700"
											disabled={!canPurchase}
										>
											Buy Credits
										</Button>
					{!canPurchase && (
											<p className="mt-2 text-xs text-muted-foreground">
												{!isAuthenticatedPatient
														? "Sign in as a patient to purchase credits."
									: "Payments are not available. Contact support."}
											</p>
										)}
									</>
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
