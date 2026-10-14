import type { ReactNode } from "react";
import "./app.css";
import { MoveProvider } from "@/lib/store";
import AppShell from "@/components/app/AppShell";

export const metadata = { title: "Your move · EZ Move" };

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return <MoveProvider><AppShell>{children}</AppShell></MoveProvider>;
}
