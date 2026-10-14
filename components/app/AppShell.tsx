"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Compass, House, ListChecks, MessageCircle } from "lucide-react";
import { useMove } from "@/lib/store";

const tabs = [
  { href: "/app", label: "Home", icon: House },
  { href: "/app/plan", label: "Plan", icon: ListChecks },
  { href: "/app/explore", label: "Explore", icon: Compass },
  { href: "/app/ask", label: "Ask", icon: MessageCircle },
];

/** Phone-first frame (max 430px, centred) with the bottom nav. Sends people without a profile to onboarding. */
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, profile } = useMove();
  const onboarding = pathname === "/app/start";
  useEffect(() => { if (ready && !profile && !onboarding) router.replace("/app/start"); }, [ready, profile, onboarding, router]);
  const active = (href: string) => href === "/app" ? pathname === "/app" || pathname.startsWith("/app/step") : pathname.startsWith(href);
  return <div className="app-frame">
    <div className="app-main">{ready && (profile || onboarding) ? children : <div className="app-loading" aria-live="polite">Loading your plan…</div>}</div>
    {!onboarding && <nav className="bottom-nav" aria-label="App">
      {tabs.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={active(href) ? "active" : ""} aria-current={active(href) ? "page" : undefined}>
        <Icon size={20} strokeWidth={active(href) ? 2.2 : 1.8} aria-hidden /><span>{label}</span>
      </Link>)}
    </nav>}
  </div>;
}
