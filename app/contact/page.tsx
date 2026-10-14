import Image from "next/image";
import "../site.css";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import ContactForm from "@/components/site/ContactForm";
import aerial from "@/public/images/abu-dhabi-aerial-bw.jpg";

export const metadata = { title: "Contact us · EZ Move" };

export default function ContactPage() {
  return <div className="site">
    <SiteNav />
    <main className="contact-hero">
      <Image src={aerial} alt="" fill priority placeholder="blur" sizes="100vw" className="contact-photo" />
      <div className="container contact-inner"><div className="contact-card"><ContactForm /></div></div>
    </main>
    <SiteFooter />
  </div>;
}
