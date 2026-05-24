import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileTopBar from "./MobileTopBar";
import MobileBottomNav from "./MobileBottomNav";

interface PageShellProps {
  children: React.ReactNode;
  breadcrumb?: string;
  mobileShowBack?: boolean;
  mobileTitle?: string;
}

export default function PageShell({
  children,
  breadcrumb,
  mobileShowBack,
  mobileTitle,
}: PageShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Sidebar />

      {/* Main content — offset by sidebar width + margins */}
      <div
        className="flex flex-col min-h-screen lg:ml-[var(--sidebar-offset)]"
        style={{ minHeight: "100vh" }}
      >
        <div className="hidden lg:block">
          <TopBar breadcrumb={breadcrumb} />
        </div>
        <MobileTopBar showBack={mobileShowBack} title={mobileTitle} />

        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
