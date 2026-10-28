import type { Metadata } from "next";
import { ExampleProfile } from "./ExampleProfile";

export const metadata: Metadata = {
  title: "Example profile",
  description: "What a FL3X profile looks like.",
};

export default function ExamplePage() {
  return <ExampleProfile />;
}
