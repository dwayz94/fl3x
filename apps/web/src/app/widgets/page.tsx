import type { Metadata } from "next";
import { WidgetsGallery } from "./WidgetsGallery";

export const metadata: Metadata = {
  title: "Widgets",
  description: "Every FL3X widget: PnL, portfolio, holdings, tokens, music, followers, community, video, clock and countdown, in large and long sizes.",
  alternates: { canonical: "/widgets" },
};

export default function WidgetsPage() {
  return <WidgetsGallery />;
}
