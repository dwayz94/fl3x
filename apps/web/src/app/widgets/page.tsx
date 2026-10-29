import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WidgetsGallery } from "./WidgetsGallery";

export const metadata: Metadata = {
  title: "Widgets",
  robots: { index: false, follow: false },
};

// Local gallery with demo data only: never served in production (no fake data on the site).
export default function WidgetsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <WidgetsGallery />;
}
