import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "EZ Move · Abu Dhabi",
  description: "Your personalised roadmap for moving to Abu Dhabi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-6">
          <Link href="/" className="font-semibold tracking-tight">EZ Move</Link>
          <nav aria-label="Main navigation" className="flex gap-5 text-sm">
            <Link href="/">Start</Link>
            <Link href="/map">Roadmap</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-12 sm:py-20">{children}</main>
      </body>
    </html>
  );
}
