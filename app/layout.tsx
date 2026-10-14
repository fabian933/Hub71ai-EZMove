import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "EZ Move · Your move. Made easy.",
  description: "One platform for the teams that bring people to Abu Dhabi, and for the people making the move.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#236A59" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${manrope.variable} ${inter.variable}`}><body>{children}</body></html>;
}
