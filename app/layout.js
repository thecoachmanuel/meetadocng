import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { getSettings } from "@/lib/settings";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata() {
  const s = await getSettings();
  return {
    title: s.siteTitle || "Doctors Appointment App",
    description: "Connect with doctors anytime, anywhere",
    icons: { icon: s.faviconUrl || "/logo.png" },
  };
}

export default async function RootLayout({ children }) {
  const s = await getSettings();
  const copyright = (s.homepageSections && s.homepageSections.footerCopyright) || `© ${new Date().getFullYear()} MeetADoc. All rights reserved.`;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={s.faviconUrl || "/logo.png"} sizes="any" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme={s.theme || "dark"}
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1">{children}</main>
          <Toaster richColors />

          <footer className="bg-muted/50 py-8 border-t border-emerald-900/20">
            <div className="container mx-auto px-4 flex flex-col gap-4 text-gray-200 text-sm md:flex-row md:items-center md:justify-between">
              <p className="text-xs md:text-sm text-muted-foreground">{copyright}</p>
              <div className="flex items-center justify-center gap-6">
                <Link
                  href="/about"
                  className="hover:text-emerald-400 transition-colors"
                >
                  About us
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
