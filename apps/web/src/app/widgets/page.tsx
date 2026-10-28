import type { Metadata } from "next";
import { WidgetsGallery } from "./WidgetsGallery";

export const metadata: Metadata = {
  title: "Widgets",
  description: "Every FL3X widget, in its large and long sizes.",
};

export default function WidgetsPage() {
  return <WidgetsGallery />;
}
