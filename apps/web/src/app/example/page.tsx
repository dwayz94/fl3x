import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExampleProfile } from "./ExampleProfile";

// Production serves a 404 here: the tab says so too, not "Example profile".
export const metadata: Metadata =
  process.env.NODE_ENV === "production"
    ? { title: "Page not found", robots: { index: false, follow: false } }
    : { title: "Example profile", robots: { index: false, follow: false } };

// Local preview with demo data only: never served in production (no fake data on the site).
export default function ExamplePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ExampleProfile />;
}
