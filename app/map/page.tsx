import { steps } from "@/lib/data";

export default function MapPage() {
  return (
    <section>
      <p className="mb-4 text-sm font-medium text-teal-800">Your relocation roadmap</p>
      <h1 className="text-4xl font-semibold tracking-tight">A clear path to settling in.</h1>
      <p className="mt-5 max-w-xl leading-relaxed text-slate-600">
        The interactive map is coming soon. The roadmap currently includes {steps.length - 1} steps and a settled milestone.
        Your profile will determine which steps apply.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Before you fly", "Landing", "Settling", "Living"].map((phase, index) => (
          <div key={phase} className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-teal-800">0{index + 1}</p>
            <h2 className="mt-3 text-lg font-medium">{phase}</h2>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">Fees, timings and links: verify with the relevant provider.</p>
    </section>
  );
}
