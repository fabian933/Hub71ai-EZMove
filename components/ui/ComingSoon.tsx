import { Hammer } from "lucide-react";
import { ButtonLink } from "./Button";
import IconTile from "./IconTile";

/** Placeholder while v2 is built screen by screen. */
export default function ComingSoon({ title }: { title: string }) {
  return <main className="container" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
    <div style={{ display: "grid", gap: 16, justifyItems: "center", textAlign: "center" }}>
      <IconTile icon={Hammer} size={48} />
      <h1 style={{ fontSize: 24 }}>{title}</h1>
      <p className="muted">This view is being rebuilt for v2.</p>
      <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
    </div>
  </main>;
}
