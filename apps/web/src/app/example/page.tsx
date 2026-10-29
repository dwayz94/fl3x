import type { Metadata } from "next";
import { ExampleProfile } from "./ExampleProfile";

export const metadata: Metadata = {
  title: "Example profile",
  description: "See what a FL3X profile looks like: live PnL, portfolio, music, community and token widgets on one card.",
  alternates: { canonical: "/example" },
};

export default function ExamplePage() {
  return <ExampleProfile />;
}
