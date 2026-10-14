import { ExternalLink } from "lucide-react";
import { siteName } from "@/lib/copy";

/** Primary "Open TAMM" style button for a step's official link. */
export default function OpenLink({ href, variant = "primary", light = false }: { href: string; variant?: "primary" | "secondary"; light?: boolean }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={`btn btn-${variant}${light ? " btn-on-navy" : ""} btn-full`}>Open {siteName(href)}<ExternalLink size={15} aria-hidden /></a>;
}
