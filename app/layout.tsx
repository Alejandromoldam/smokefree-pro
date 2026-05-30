import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
        <div className="electric-background" aria-hidden="true">
          <div className="electric-fog" />
          <div className="electric-circuit-grid" />

          <div className="electric-lines">
            {Array.from({ length: 6 }).map((_, idx) => (
              <span key={`line-${idx}`} className={`electric-line line-${idx + 1}`} />
            ))}
          </div>

          <div className="electric-particles">
            {Array.from({ length: 32 }).map((_, idx) => (
              <span key={`particle-${idx}`} className={`electric-particle p-${idx + 1}`} />
            ))}
          </div>
        </div>

        <div className="app-content">{children}</div>
      </body>
    </html>
  );
}
