import PageShell from "@/components/layout/PageShell";
import { Users } from "lucide-react";

export default function GroupsPage() {
  return (
    <PageShell breadcrumb="My Groups" mobileShowBack={false}>
      <div className="p-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: "var(--color-green)" }}
          />
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            My Groups
          </h1>
        </div>
        <p
          className="mb-8 text-sm"
          style={{ color: "var(--color-text-muted)", marginLeft: "1.35rem" }}
        >
          Manage your student groups and classes.
        </p>

        {/* Coming-soon empty state */}
        <div
          className="flex flex-col items-center justify-center gap-5 py-20 rounded-2xl"
          style={{ border: "1.5px dashed var(--color-border)" }}
        >
          {/* Icon container */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--color-nav-active-bg)" }}
          >
            <Users
              size={28}
              strokeWidth={1.5}
              style={{ color: "var(--color-text-muted)" }}
            />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            {/* Coming soon badge */}
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: "var(--color-accent-light)",
                color: "var(--color-accent)",
                border: "1px solid rgba(232,82,26,0.2)",
              }}
            >
              Coming Soon
            </span>

            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Groups are on the way
            </p>
            <p
              className="text-xs max-w-xs leading-relaxed"
              style={{ color: "var(--color-text-subtle)" }}
            >
              Groups will let you organise your students into classes, assign work
              in bulk, and track class-wide performance — all in one place.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
