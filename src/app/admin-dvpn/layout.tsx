import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | Doppler VPN",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-bg-primary text-text-primary font-body antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
