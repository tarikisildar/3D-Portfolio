import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import SiteWrapper from "@/components/layout/SiteWrapper";
import { Analytics } from '@vercel/analytics/react';
import GoogleAnalytics from "@/components/GoogleAnalytics";
import PageViewTracker from "@/components/PageViewTracker";

/**
 * One family, doing two jobs through its width axis.
 *
 * Archivo is a grotesque with a real `wdth` axis, so display type can be set
 * wide and tight — the lettering of a drawing-set title block — while the same
 * family at normal width handles running text. Width, rather than a second
 * typeface, is what carries the personality here.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tarik Isildar | Portfolio",
  description: "Interactive portfolio showcasing Tarik Isildar's projects and skills",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} antialiased`}
      >
        <SiteWrapper>{children}</SiteWrapper>
        <Analytics />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <PageViewTracker />
      </body>
    </html>
  );
}
