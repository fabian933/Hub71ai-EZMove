import type { ComponentProps } from "react";

export default function Card({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={["card", className].filter(Boolean).join(" ")} />;
}
