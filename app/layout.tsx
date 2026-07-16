import type { Metadata } from "next";
import Script from "next/script";
import {
  Inter,
  Playfair_Display,
  Poppins,
  Cormorant_Garamond,
} from "next/font/google";
import BackgroundEffects from "@/components/BackgroundEffects";
import AIAssistantWidget from "@/components/AIAssistantWidget";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import GaPageTracker from "@/components/GaPageTracker";
import { GA_MEASUREMENT_ID, META_PIXEL_ID } from "@/lib/ga";
import { GOOGLE_ADS_ID } from "@/lib/ga";
import {
  buildOrganizationSchema,
  buildWebsiteSchema,
  getStructuredDataSiteUrl,
  toJsonLd,
} from "@/lib/structuredData";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Elora Skin brand type system (loaded via next/font, exposed as CSS variables).
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const SITE_DESCRIPTION =
  "Elora Skin ofrece skincare premium con disponibilidad real y una experiencia de compra segura.";

export const metadata: Metadata = {
  metadataBase: new URL("https://allinonestore.lat"),
  title: {
    default: "Elora Skin",
    template: "%s | Elora Skin",
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
  verification: {
    google: "hiKxUIqm2HusZgwphFrn-WHSSMrphwm0QK9X3Uug9Og",
  },
  openGraph: {
    title: "Elora Skin",
    description: SITE_DESCRIPTION,
    url: "https://allinonestore.lat",
    siteName: "Elora Skin",
    type: "website",
    images: [
      {
        url: "/producto-real.png",
        alt: "Elora Skin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elora Skin",
    description: SITE_DESCRIPTION,
    images: ["/producto-real.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getStructuredDataSiteUrl();
  const hasGaMeasurementId = Boolean(GA_MEASUREMENT_ID);
  const hasMetaPixelId = Boolean(META_PIXEL_ID);
  const hasGoogleAdsId = Boolean(GOOGLE_ADS_ID);
  const organizationJsonLd = toJsonLd(buildOrganizationSchema(siteUrl));
  const websiteJsonLd = toJsonLd(buildWebsiteSchema(siteUrl));

  return (
    <html lang="es">
      <body
        className={`${inter.className} ${playfair.variable} ${poppins.variable} ${cormorant.variable} relative overflow-x-hidden`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
        />
       {hasGoogleAdsId ? (
  <>
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
      strategy="afterInteractive"
    />
    <Script id="google-ads-init" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GOOGLE_ADS_ID}');
      `}
    </Script>
  </>
) : null}
        {hasMetaPixelId ? (
          <>
            <Script id="meta-pixel-init" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
              `}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        ) : null}
        {hasGaMeasurementId || hasMetaPixelId ? <GaPageTracker /> : null}

        <BackgroundEffects />

        <div className="app-content">{children}</div>
        <AIAssistantWidget />
        <FloatingWhatsAppButton />
      </body>
    </html>
  );
}
