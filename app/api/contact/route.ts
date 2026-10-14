import { ContactSchema } from "@/lib/contact";

export const runtime = "nodejs";

/** Emails the submission through Resend when configured; otherwise logs it on the server. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  // Hidden field that people never fill in; bots often do.
  if (body && typeof body === "object" && "website" in body && body.website) return Response.json({ ok: true });
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false, error: "Check the highlighted fields." }, { status: 400 });
  const contact = parsed.data;
  const text = [
    `Name: ${contact.firstName} ${contact.lastName}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone}`,
    `Job title: ${contact.jobTitle}`,
    `Company: ${contact.company}`,
    "",
    contact.message || "(no message)",
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (apiKey && to) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Resend's shared test sender. Swap for a verified domain address before launch.
        from: "EZ Move <onboarding@resend.dev>",
        to: [to],
        reply_to: contact.email,
        subject: `Demo request: ${contact.company}`,
        text,
      }),
    }).catch(() => null);
    if (!response?.ok) {
      console.error("Contact form: Resend failed", response?.status);
      return Response.json({ ok: false, error: "We couldn't send your message. Please try again." }, { status: 502 });
    }
    return Response.json({ ok: true });
  }
  console.log(`Contact form submission (email not configured):\n${text}`);
  return Response.json({ ok: true });
}
