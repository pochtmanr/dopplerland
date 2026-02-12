import "@/app/globals.css";

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
    <html lang="en">
      <body className="min-h-screen bg-bg-primary text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
