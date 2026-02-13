import { BarLoader } from "react-spinners";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <BarLoader color="#10b981" width={200} />
      <p className="text-muted-foreground animate-pulse">Loading pricing plans...</p>
    </div>
  );
}
