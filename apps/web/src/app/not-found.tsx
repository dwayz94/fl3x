import type { Metadata } from "next";
import { NotFoundView } from "@/components/shared";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return <NotFoundView />;
}
