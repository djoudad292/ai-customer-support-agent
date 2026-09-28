import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Try the AI Support demo — live",
  description:
    "Try the AI customer support agent live. Answer questions from documents, open tickets, check orders and hand off to a human — no account needed.",
};

export default function TryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
