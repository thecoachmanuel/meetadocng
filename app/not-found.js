import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Stethoscope } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="bg-muted/20 border-emerald-900/30 shadow-lg">
          <CardContent className="p-8 md:p-10 text-center">
            <div className="space-y-6">
              <Badge variant="outline" className="bg-emerald-900/30 border-emerald-700/30 text-emerald-400">Page Not Found</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-white">404</h1>
              <p className="text-muted-foreground text-lg">
                The page you are looking for doesn’t exist or has been moved.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Home
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-emerald-700/30 hover:bg-muted/80">
                  <Link href="/doctors">
                    <Stethoscope className="mr-2 h-4 w-4" /> Find Doctors
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
