import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "EZ Move · Your move. Made easy.", description: "A clear, step-by-step plan for founders and teams moving to Abu Dhabi." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
