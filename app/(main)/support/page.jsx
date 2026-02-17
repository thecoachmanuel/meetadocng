import { redirect } from "next/navigation";
import { getSupportOverview } from "@/actions/support-chat";
import SupportChat from "./support-chat";

export const metadata = {
  title: "Support Chat - MeetADoc",
  description: "Chat with the MeetADoc support team in real time",
};

export default async function SupportPage() {
  const overview = await getSupportOverview();

  if (!overview.currentUser) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SupportChat initialData={overview} />
    </div>
  );
}

