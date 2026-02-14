import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { DashboardHeader } from "@/components/dashboard-header";
import { QuickAddFAB } from "@/components/quick-add-fab";
import { Providers } from "@/components/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <DashboardHeader />
          <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
          <MobileNav />
          <QuickAddFAB />
        </div>
      </div>
    </Providers>
  );
}
