import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Entrika - Tanismadan Once Tani",
  description:
    "Topluluk Destekli Dating ve Sosyal Istihbarat Platformu. Kullanicilar birbirini degerlendirebilir, topluluk puanlari gorebilir ve guvenli bir dating deneyimi yasayabilir.",
  openGraph: {
    title: "Entrika",
    description: "Tanismadan Once Tani",
    siteName: "Entrika",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
