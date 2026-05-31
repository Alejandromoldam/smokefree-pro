import type { Metadata } from "next";
import { Inter } from "next/font/google";
import BackgroundEffects from "@/components/BackgroundEffects";
import AIAssistantWidget from "@/components/AIAssistantWidget";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://allinonestore.lat"),
  title: {
    default: "All In One Store",
    template: "%s | All In One Store",
  },
  description:
    "All In One Store reúne productos tecnológicos y soluciones innovadoras seleccionadas para mejorar tu experiencia diaria.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "All In One Store",
    description:
      "All In One Store reúne productos tecnológicos y soluciones innovadoras seleccionadas para mejorar tu experiencia diaria.",
    url: "https://allinonestore.lat",
    siteName: "All In One Store",
    type: "website",
    images: [
      {
        url: "/producto-real.png",
        alt: "All In One Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All In One Store",
    description:
      "All In One Store reúne productos tecnológicos y soluciones innovadoras seleccionadas para mejorar tu experiencia diaria.",
    images: ["/producto-real.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} relative overflow-x-hidden`}>
        <BackgroundEffects />

        <div className="app-content">{children}</div>
        <AIAssistantWidget />
      </body>
    </html>
  );
}
