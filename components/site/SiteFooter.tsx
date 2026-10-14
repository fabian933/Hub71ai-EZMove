import Link from "next/link";
import { Logo } from "./SiteNav";

export const photoCredits = [
  { what: "Aerial photo of Al Ghadeer, Abu Dhabi", name: "Dovlet Hojayev", photo: "https://unsplash.com/photos/qcFtWokDGe8", profile: "https://unsplash.com/@dhojayev" },
  { what: "Abu Dhabi skyline from the Corniche", name: "Anshul Hari", photo: "https://unsplash.com/photos/jVcpKCLk114", profile: "https://unsplash.com/@anshul_hari" },
];

export default function SiteFooter() {
  return <footer className="site-footer"><div className="container site-footer-inner">
    <div className="site-footer-row"><Logo /><span>© 2026 EZ Move</span><Link href="/privacy">Privacy Policy</Link></div>
    <p className="photo-credits">Photos: {photoCredits.map((credit, index) => <span key={credit.photo}>{index > 0 && " · "}<a href={credit.photo} target="_blank" rel="noopener noreferrer">{credit.what}</a> by <a href={credit.profile} target="_blank" rel="noopener noreferrer">{credit.name}</a></span>)} on <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>.</p>
  </div></footer>;
}
