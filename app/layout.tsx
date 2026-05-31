import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import BackgroundEffects from "@/components/BackgroundEffects";
import AIAssistantWidget from "@/components/AIAssistantWidget";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import GaPageTracker from "@/components/GaPageTracker";
import { GA_MEASUREMENT_ID } from "@/lib/ga";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const SITE_DESCRIPTION =
  "All In One Store reune productos tecnologicos y soluciones innovadoras seleccionadas para mejorar tu experiencia diaria.";

export const metadata: Metadata = {
  metadataBase: new URL("https://allinonestore.lat"),
  title: {
    default: "All In One Store",
    template: "%s | All In One Store",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "All In One Store",
    description: SITE_DESCRIPTION,
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
    description: SITE_DESCRIPTION,
    images: ["/producto-real.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasGaMeasurementId = Boolean(GA_MEASUREMENT_ID);

  return (
    <html lang="es">
      <body className={`${inter.className} relative overflow-x-hidden`}>
        {hasGaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
              `}
            </Script>
            <GaPageTracker />
          </>
        ) : null}

        <BackgroundEffects />

        <div className="app-content">{children}</div>
        <AIAssistantWidget />
        <FloatingWhatsAppButton />
      </body>
    </html>
  );
}
