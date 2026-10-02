import Link from "next/link";

export default function HomePage() {
  return (
    <section className="max-w-2xl">
      <p className="mb-4 text-sm font-medium text-teal-800">Moving to Abu Dhabi</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Know your next step.</h1>
      <p className="mt-6 text-lg leading-relaxed text-slate-600">
        A roadmap for your move, from preparing documents to settling in.
      </p>
      <p className="mt-5 text-sm text-slate-500">Your personalised intake is coming soon.</p>
      <Link href="/map" className="mt-8 inline-block rounded-full bg-teal-900 px-6 py-3 font-medium text-white">
        View roadmap preview
      </Link>
    </section>
  );
}
