"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Calendar, BarChart3, CreditCard, Loader2, AlertCircle, Coins } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { requestPayout } from "@/actions/payout";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function DoctorEarnings({ earnings, payouts = [], nairaRate = 1000, perCreditEarning = 8 }) {
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const {
    thisMonthEarningsNaira = 0,
    completedAppointments = 0,
    averageEarningsPerMonth = 0,
    availableCredits = 0,
    availablePayout = 0,
  } = earnings;

  const { loading, data, fn: submitPayoutRequest } = useFetch(requestPayout);
  const pendingPayout = payouts.find((payout) => payout.status === "PROCESSING");

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    if (!bankName || !accountName || !accountNumber) {
      toast.error("All bank details are required");
      return;
    }
    const formData = new FormData();
    formData.append("bankName", bankName);
    formData.append("accountName", accountName);
    formData.append("accountNumber", accountNumber);
    await submitPayoutRequest(formData);
  };

  useEffect(() => {
    if (data?.success) {
      setShowPayoutDialog(false);
      setBankName("");
      setAccountName("");
      setAccountNumber("");
      toast.success("Payout request submitted successfully!");
    }
  }, [data]);

  const platformFee = 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Credits</p>
                <p className="text-3xl font-bold text-white">{availableCredits}</p>
                <p className="text-xs text-muted-foreground">{formatNaira(availablePayout)} available for payout</p>
              </div>
              <div className="bg-emerald-900/20 p-3 rounded-full">
                <Coins className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold text-white">{formatNaira(thisMonthEarningsNaira)}</p>
              </div>
              <div className="bg-emerald-900/20 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
                <p className="text-3xl font-bold text-white">{completedAppointments}</p>
                <p className="text-xs text-muted-foreground">completed</p>
              </div>
              <div className="bg-emerald-900/20 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg/Month</p>
                <p className="text-3xl font-bold text-white">{formatNaira(averageEarningsPerMonth)}</p>
              </div>
              <div className="bg-emerald-900/20 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-emerald-400" />
            Payout Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white">Available for Payout</h3>
              {pendingPayout ? (
                <Badge variant="outline" className="bg-amber-900/20 border-amber-900/30 text-amber-400">PROCESSING</Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">Available</Badge>
              )}
            </div>

            {pendingPayout ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pending Credits</p>
                    <p className="text-white font-medium">{pendingPayout.credits}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pending Amount</p>
                    <p className="text-white font-medium">{formatNaira(pendingPayout.netAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bank Details</p>
                    <p className="text-white font-medium text-xs">{pendingPayout.bankName} • {pendingPayout.accountName} • {pendingPayout.accountNumber}</p>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">Your payout request is being processed. You'll receive the payment once an admin approves it. Your credits will be deducted after processing.</AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Available Credits</p>
                  <p className="text-white font-medium">{availableCredits}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payout Amount</p>
                  <p className="text-white font-medium">{formatNaira(availablePayout)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Platform Fee</p>
                  <p className="text-white font-medium">{formatNaira(platformFee)}</p>
                </div>
              </div>
            )}

            {!pendingPayout && availableCredits > 0 && (
              <Button onClick={() => setShowPayoutDialog(true)} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">Request Payout for All Credits</Button>
            )}

            {availableCredits === 0 && !pendingPayout && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No credits available for payout. Complete more appointments to earn credits.</p>
              </div>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm"><strong>Payout Structure:</strong> You earn {formatNaira(perCreditEarning * nairaRate)} per credit. No platform fee is deducted. Payouts include all your available credits and are processed after admin approval.</AlertDescription>
          </Alert>

          {payouts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Payout History</h3>
              <div className="space-y-2">
                {payouts.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 rounded-md bg-muted/10 border border-emerald-900/10">
                    <div>
                      <p className="text-white font-medium">{format(new Date(payout.createdAt), "MMM d, yyyy")}</p>
                      <p className="text-sm text-muted-foreground">{payout.credits} credits • {formatNaira(payout.netAmount)}</p>
                      <p className="text-xs text-muted-foreground">{payout.bankName} • {payout.accountName} • {payout.accountNumber}</p>
                    </div>
                    <Badge variant="outline" className={payout.status === "PROCESSED" ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400" : "bg-amber-900/20 border-amber-900/30 text-amber-400"}>{payout.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Request Payout</DialogTitle>
            <DialogDescription>Enter your bank details to receive payout</DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePayoutRequest} className="space-y-4">
            <div className="bg-muted/20 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available credits:</span>
                <span className="text-white">{availableCredits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net payout:</span>
                <span className="text-emerald-400 font-medium">{formatNaira(availablePayout)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" placeholder="e.g. Access Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} className="bg-background border-emerald-900/20" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input id="accountName" placeholder="e.g. John Doe" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="bg-background border-emerald-900/20" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" placeholder="e.g. 0123456789" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="bg-background border-emerald-900/20" required />
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">Once processed by admin, {availableCredits} credits will be deducted from your account and {formatNaira(availablePayout)} will be transferred to your bank account.</AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPayoutDialog(false)} disabled={loading} className="border-emerald-900/30">Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">{loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Requesting...</>) : ("Request Payout")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
