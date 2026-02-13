import { Inter } from "next/font/google";
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
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme={s.theme || "dark"}
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="min-h-screen pb-28">{children}</main>
          <Toaster richColors />

          <footer className="bg-muted/50 py-12 fixed bottom-0 left-0 right-0">
            <div className="container mx-auto px-4 text-center text-gray-200">
              <p>{copyright}</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
