import type { Metadata } from "next";
import { Outfit, Playfair_Display, Libre_Baskerville } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const libre = Libre_Baskerville({
  variable: "--font-libre",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Miracle Memory — Bible Memorization",
  description: "Memorize scripture one verse at a time. 6 languages, spaced repetition, and a global community. Start your 7-day free trial.",
  metadataBase: new URL("https://www.miraclememory.org"),
  openGraph: {
    title: "Miracle Memory — Bible Memorization",
    description: "Miracles happen in your life. Start memorizing scripture today in 6 languages.",
    url: "https://www.miraclememory.org",
    siteName: "Miracle Memory",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Miracle Memory — Bible Memorization App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miracle Memory — Bible Memorization",
    description: "Miracles happen in your life. Start memorizing scripture today in 6 languages.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${playfair.variable} ${libre.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
