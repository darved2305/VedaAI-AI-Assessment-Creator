import PageShell from "@/components/layout/PageShell";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <PageShell breadcrumb="Settings" mobileShowBack={false}>
      <div className="p-6 min-h-screen">
        <div className="flex items-center gap-3 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: "var(--color-green)" }}
          />
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Settings
          </h1>
        </div>
        <p
          className="mb-8 text-sm"
          style={{ color: "var(--color-text-muted)", marginLeft: "1.35rem" }}
        >
          Manage your account and preferences.
        </p>

        <div
          className="flex flex-col items-center justify-center gap-4 py-24"
          style={{ color: "var(--color-text-subtle)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--color-nav-active-bg)" }}
          >
            <Settings size={28} strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            Settings coming soon
          </p>
        </div>
      </div>
    </PageShell>
  );
}
