"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { stepIcon } from "./icons";
import StepPill from "./StepPill";
import type { Step } from "@/lib/schema";

export default function StepRow({ step }: { step: Step }) {
  const Icon = stepIcon(step);
  return <li><Link href={`/app/step/${step.id}`} className="step-row">
    <span className="step-row-icon"><Icon size={18} strokeWidth={1.8} aria-hidden /></span>
    <span className="step-row-body"><span className="step-row-title">{step.title}</span><StepPill step={step} /></span>
    <ChevronRight size={18} className="step-row-chevron" aria-hidden />
  </Link></li>;
}
