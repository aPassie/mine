import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
        <div className="mx-auto w-full max-w-[760px]">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
