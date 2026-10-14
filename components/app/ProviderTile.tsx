import type { Provider } from "@/lib/schema";

/** A marketplace provider. Coverage is illustrative until partners are confirmed. */
export default function ProviderTile({ provider }: { provider: Provider }) {
  return <div className={`provider-tile${provider.placeholder ? " placeholder" : ""}`}>
    <span className="provider-logo" aria-hidden>{provider.placeholder ? "?" : provider.name.replace(/[^A-Za-z]/g, "").slice(0, 2)}</span>
    <span className="provider-body"><strong>{provider.name}</strong><small>{provider.categoryLabel}</small></span>
    {!provider.placeholder && <span className="covered-tag">Covered by your company</span>}
  </div>;
}
