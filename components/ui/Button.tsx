import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary";
const classes = (variant: Variant, size: "md" | "sm", full: boolean, extra?: string) =>
  ["btn", `btn-${variant}`, size === "sm" && "btn-sm", full && "btn-full", extra].filter(Boolean).join(" ");

type Common = { variant?: Variant; size?: "md" | "sm"; full?: boolean; children: ReactNode };

export function Button({ variant = "primary", size = "md", full = false, className, ...props }: Common & ComponentProps<"button">) {
  return <button type="button" {...props} className={classes(variant, size, full, className)} />;
}

/** A link styled as a button. External and mailto links use a plain anchor. */
export function ButtonLink({ variant = "primary", size = "md", full = false, className, href, ...props }: Common & ComponentProps<"a"> & { href: string }) {
  const className_ = classes(variant, size, full, className);
  return href.startsWith("/") ? <Link href={href} {...props} className={className_} /> : <a href={href} {...props} className={className_} />;
}
