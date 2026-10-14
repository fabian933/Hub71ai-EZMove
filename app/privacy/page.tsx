import Link from "next/link";
import "../site.css";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata = { title: "Privacy Policy · EZ Move" };

export default function Privacy() {
  return <div className="site">
    <SiteNav />
    <main className="container legal">
      <h1>Privacy Policy</h1>
      <p className="muted">Our privacy policy is being written and will be published here.</p>
      <p>Questions about your data in the meantime? <Link href="/contact">Contact us</Link>.</p>
    </main>
    <SiteFooter />
  </div>;
}
