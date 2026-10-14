"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { contactErrors, type Contact, type ContactErrors } from "@/lib/contact";
import { Button } from "@/components/ui/Button";

type Field = { name: keyof Contact; label: string; placeholder: string; type?: string; autoComplete?: string; required?: boolean; wide?: boolean };
const fields: Field[] = [
  { name: "firstName", label: "First name", placeholder: "First name", autoComplete: "given-name", required: true },
  { name: "lastName", label: "Last name", placeholder: "Last name", autoComplete: "family-name", required: true },
  { name: "email", label: "Email address", placeholder: "Work email address", type: "email", autoComplete: "email", required: true },
  { name: "phone", label: "Phone number", placeholder: "+971 50 000 0000", type: "tel", autoComplete: "tel", required: true },
  { name: "jobTitle", label: "Job title", placeholder: "Job title", autoComplete: "organization-title", required: true },
  { name: "company", label: "Company name", placeholder: "Company name", autoComplete: "organization", required: true },
];
const empty: Contact = { firstName: "", lastName: "", email: "", phone: "", jobTitle: "", company: "", message: "" };

export default function ContactForm() {
  const [values, setValues] = useState<Contact>(empty);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState("");
  const [website, setWebsite] = useState("");

  function change(name: keyof Contact, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    if (touched) setErrors(contactErrors(next));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    const found = contactErrors(values);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`contact-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setState("sending"); setFormError("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, website }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error);
      setState("sent");
    } catch (error) {
      setState("idle");
      setFormError(error instanceof Error && error.message ? error.message : "We couldn't send your message. Please try again.");
    }
  }

  if (state === "sent") return <div className="contact-sent" role="status">
    <CircleCheck size={40} strokeWidth={1.6} aria-hidden />
    <h2>Thanks, we&apos;ll be in touch within 2 working days.</h2>
  </div>;

  return <form className="contact-form" onSubmit={submit} noValidate>
    <h1>Contact us</h1>
    <div className="contact-grid">
      {fields.map((field) => <div key={field.name} className="contact-field">
        <label htmlFor={`contact-${field.name}`}>{field.label}{field.required && <span aria-hidden>*</span>}</label>
        <input id={`contact-${field.name}`} name={field.name} type={field.type ?? "text"} autoComplete={field.autoComplete} placeholder={field.placeholder}
          value={values[field.name]} onChange={(event) => change(field.name, event.target.value)} required={field.required}
          aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `contact-${field.name}-error` : undefined} />
        {errors[field.name] && <span id={`contact-${field.name}-error`} className="field-error">{errors[field.name]}</span>}
      </div>)}
      <div className="contact-field wide">
        <label htmlFor="contact-message">Message</label>
        <textarea id="contact-message" name="message" rows={4} placeholder="How can we help?" value={values.message} onChange={(event) => change("message", event.target.value)}
          aria-invalid={!!errors.message} aria-describedby={errors.message ? "contact-message-error" : undefined} />
        {errors.message && <span id="contact-message-error" className="field-error">{errors.message}</span>}
      </div>
      <input className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden name="website" value={website} onChange={(event) => setWebsite(event.target.value)} />
    </div>
    {formError && <p className="field-error form-error" role="alert">{formError}</p>}
    <Button type="submit" disabled={state === "sending"} className="contact-submit">{state === "sending" ? "Sending…" : "Submit"}</Button>
    <p className="contact-small">By submitting this form, you agree to our <Link href="/privacy">Privacy Policy</Link>. Your information is kept confidential.</p>
  </form>;
}
