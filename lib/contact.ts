import { z } from "zod";

const required = (label: string) => z.string().trim().min(1, `${label} is required.`).max(200, `${label} is too long.`);

export const ContactSchema = z.object({
  firstName: required("First name"),
  lastName: required("Last name"),
  email: z.string().trim().min(1, "Email address is required.").email("Enter a valid email address.").max(200),
  phone: required("Phone number").regex(/^[+\d][\d\s()-]{5,}$/, "Enter a valid phone number."),
  jobTitle: required("Job title"),
  company: required("Company name"),
  message: z.string().trim().max(3000, "Message is too long.").default(""),
});
export type Contact = z.infer<typeof ContactSchema>;
export type ContactErrors = Partial<Record<keyof Contact, string>>;

export function contactErrors(value: unknown): ContactErrors {
  const parsed = ContactSchema.safeParse(value);
  if (parsed.success) return {};
  const errors: ContactErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof Contact;
    errors[key] ??= issue.message;
  }
  return errors;
}
