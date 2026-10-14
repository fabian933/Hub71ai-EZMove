"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { useMove } from "@/lib/store";
import PageHeader from "@/components/ui/PageHeader";

type Message = { role: "user" | "assistant"; text: string; stepId?: string | null };
const suggestions = ["When can I open a bank account?", "What do I need for my visa?", "Can my family come with me?"];

export default function Ask() {
  const { profile, roadmap } = useMove();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { const q = new URLSearchParams(window.location.search).get("q"); if (q) setDraft(q.slice(0, 500)); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);
  if (!profile) return null;
  const titleOf = (id: string) => roadmap.find((step) => step.id === id)?.shortTitle;

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    const history = messages.slice(-6).map(({ role, text: body }) => ({ role, text: body }));
    setMessages((current) => [...current, { role: "user", text }]); setDraft(""); setBusy(true);
    try {
      const response = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text, profile, history }) });
      const result = await response.json();
      setMessages((current) => [...current, { role: "assistant", text: result.answer ?? "Check with your company or the official site.", stepId: result.stepId }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "Check with your company or the official site." }]);
    } finally { setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void ask(draft); }

  return <div className="app-page ask-page">
    <PageHeader title="Ask" description="Questions about your move, answered from your plan." />
    <div className="chat" aria-live="polite">
      {messages.length === 0 && <div className="chip-row suggestions">{suggestions.map((q) => <button key={q} type="button" className="chip" onClick={() => ask(q)}>{q}</button>)}</div>}
      {messages.map((message, index) => <div key={index} className={`bubble ${message.role}`}>
        <p>{message.text}</p>
        {message.stepId && titleOf(message.stepId) && <Link href={`/app/step/${message.stepId}`} className="bubble-link">View step: {titleOf(message.stepId)}</Link>}
      </div>)}
      {busy && <div className="bubble assistant typing"><span /><span /><span /></div>}
      <div ref={end} />
    </div>
    <form className="ask-form" onSubmit={submit}>
      <label htmlFor="ask-input" className="sr-only">Ask about your move</label>
      <input id="ask-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about your move…" maxLength={500} autoComplete="off" />
      <button type="submit" aria-label="Send" disabled={!draft.trim() || busy}><ArrowUp size={18} aria-hidden /></button>
    </form>
    <p className="ask-note">Answers from your company&apos;s guide and official sources.</p>
  </div>;
}
