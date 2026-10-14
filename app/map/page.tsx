import { redirect } from "next/navigation";

/** Old shared links (/map?p=…) open the employee app with the same profile. */
export default async function MapRedirect({ searchParams }: { searchParams: Promise<{ p?: string | string[] }> }) {
  const { p } = await searchParams;
  redirect(typeof p === "string" ? `/app?p=${encodeURIComponent(p)}` : "/app");
}
