import Link from "next/link";
import { Brand, buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-8xl">
        <Brand>4[0]4</Brand>
      </h1>
      <p className="text-fg-2">Nothing to flex here.</p>
      <Link href="/" className={buttonClass()}>
        Back home
      </Link>
    </main>
  );
}
