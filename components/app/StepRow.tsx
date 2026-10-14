"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { stepIcon } from "./icons";
import StepPill from "./StepPill";
import "./StepRow.css";
import type { Step } from "@/lib/schema";

/** A milestone row. Read-only rows (the team view) don't link into the employee app. */
export default function StepRow({ step, readOnly = false }: { step: Step; readOnly?: boolean }) {
  const Icon = stepIcon(step);
  const body = <>
    <span className="step-row-icon"><Icon size={18} strokeWidth={1.8} aria-hidden /></span>
    <span className="step-row-body"><span className="step-row-title">{step.title}</span><StepPill step={step} /></span>
    {!readOnly && <ChevronRight size={18} className="step-row-chevron" aria-hidden />}
  </>;
  return <li>{readOnly ? <div className="step-row">{body}</div> : <Link href={`/app/step/${step.id}`} className="step-row">{body}</Link>}</li>;
}
