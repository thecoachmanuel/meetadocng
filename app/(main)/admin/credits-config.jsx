"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSiteSettings } from "@/actions/site-settings";
import { toast } from "sonner";

export default function CreditsConfig({ initialSettings }) {
  const [appointmentCreditCost, setAppointmentCreditCost] = useState(initialSettings.appointmentCreditCost || 2);
  const [doctorEarningPerCredit, setDoctorEarningPerCredit] = useState(initialSettings.doctorEarningPerCredit || 8);
  const [creditToNairaRate, setCreditToNairaRate] = useState(initialSettings.creditToNairaRate || 1000);
  const [adminEarningPercentage, setAdminEarningPercentage] = useState(initialSettings.adminEarningPercentage || 20);
  const [freeCredits, setFreeCredits] = useState(initialSettings.freeCredits || 2);
  const [standardCredits, setStandardCredits] = useState(initialSettings.standardCredits || 10);
  const [premiumCredits, setPremiumCredits] = useState(initialSettings.premiumCredits || 24);

  const onSave = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("appointmentCreditCost", String(appointmentCreditCost));
    fd.append("doctorEarningPerCredit", String(doctorEarningPerCredit));
    fd.append("creditToNairaRate", String(creditToNairaRate));
    fd.append("adminEarningPercentage", String(adminEarningPercentage));
    fd.append("freeCredits", String(freeCredits));
    fd.append("standardCredits", String(standardCredits));
    fd.append("premiumCredits", String(premiumCredits));
    try {
      await updateSiteSettings(fd);
      toast.success("Credit settings updated");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Credit Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Credits per Video Call</Label>
            <Input type="number" value={appointmentCreditCost} onChange={(e) => setAppointmentCreditCost(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Doctor Earning per Credit (multiplier)</Label>
            <Input type="number" value={doctorEarningPerCredit} onChange={(e) => setDoctorEarningPerCredit(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Credit → Naira Rate</Label>
            <Input type="number" value={creditToNairaRate} onChange={(e) => setCreditToNairaRate(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Admin Earning Percentage (%)</Label>
            <Input type="number" value={adminEarningPercentage} onChange={(e) => setAdminEarningPercentage(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Free Credits</Label>
            <Input type="number" value={freeCredits} onChange={(e) => setFreeCredits(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Standard Package Credits</Label>
            <Input type="number" value={standardCredits} onChange={(e) => setStandardCredits(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Premium Package Credits</Label>
            <Input type="number" value={premiumCredits} onChange={(e) => setPremiumCredits(Number(e.target.value))} />
          </div>
          <div className="col-span-full">
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
