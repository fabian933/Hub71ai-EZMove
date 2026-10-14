import type { LucideIcon } from "lucide-react";

/** Mint square holding one outline icon. */
export default function IconTile({ icon: Icon, size = 40 }: { icon: LucideIcon; size?: number }) {
  return <span className="icon-tile" style={{ width: size, height: size }}><Icon size={Math.round(size * 0.5)} strokeWidth={1.8} aria-hidden /></span>;
}
