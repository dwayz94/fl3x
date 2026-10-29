import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WidgetsGallery } from "./WidgetsGallery";

// Production serves a 404 here: the tab says so too, not "Widgets".
export const metadata: Metadata =
  process.env.NODE_ENV === "production"
    ? { title: "Page not found", robots: { index: false, follow: false } }
    : { title: "Widgets", robots: { index: false, follow: false } };

// Local gallery with demo data only: never served in production (no fake data on the site).
export default function WidgetsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <WidgetsGallery />;
}
