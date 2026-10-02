import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "EZ Move · Your Abu Dhabi roadmap", description: "From the first document to feeling settled. Your personalised relocation roadmap for Abu Dhabi." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
