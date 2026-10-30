import { Footer, Navbar } from "@/components/shared";
import { HelpMobileNav } from "@/components/help/MobileNav";
import { HelpSidebar } from "@/components/help/Sidebar";

/** Help Center: grouped sidebar on the left (a menu on phones), the page on the right. */
export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="px-gutter">
        <div className="grid gap-8 py-10 md:py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <aside className="hidden self-start lg:sticky lg:top-8 lg:block">
            <HelpSidebar />
          </aside>
          <HelpMobileNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
