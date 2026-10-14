import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { DEMO_MAILTO } from "./content";

export function Logo() {
  return <Link href="/" className="site-logo" aria-label="EZ Move home"><span className="site-logo-mark">ez</span>EZ Move</Link>;
}

export default function SiteNav() {
  return <header className="site-nav"><div className="container site-nav-inner">
    <Logo />
    <nav aria-label="Main" className="site-nav-links">
      <a href="#teams">For teams</a>
      <a href="#employees">For employees</a>
      <a href="#features">Features</a>
    </nav>
    <ButtonLink href={DEMO_MAILTO} size="sm">Book a demo</ButtonLink>
  </div></header>;
}
