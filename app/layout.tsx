import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Standup Roulette",
  description:
    "3D physics roulette that picks one winner for daily standup. Drop a ball per teammate, highest pocket wins.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={display.variable}>
      <body>{children}</body>
    </html>
  );
}
