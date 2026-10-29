import { notFound } from "next/navigation";
import { XKitCanvas } from "./XKitCanvas";

// Dev-only canvas for the X kit images. scripts/x-kit.sh screenshots each one.
export default async function XKitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (process.env.NODE_ENV === "production") notFound();
  return <XKitCanvas slug={slug} />;
}
