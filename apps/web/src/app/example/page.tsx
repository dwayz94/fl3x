import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExampleProfile } from "./ExampleProfile";

export const metadata: Metadata = {
  title: "Example profile",
  robots: { index: false, follow: false },
};

// Local preview with demo data only: never served in production (no fake data on the site).
export default function ExamplePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ExampleProfile />;
}
