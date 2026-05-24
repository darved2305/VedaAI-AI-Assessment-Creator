"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ClipboardList, BookOpen, MonitorSmartphone } from "lucide-react";

const tabs = [
  { icon: LayoutGrid, label: "Home", href: "/home" },
  { icon: ClipboardList, label: "Assignments", href: "/assignments" },
  { icon: BookOpen, label: "Library", href: "/library" },
  { icon: MonitorSmartphone, label: "AI Toolkit", href: "/toolkit" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex lg:hidden"
      style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        zIndex: 40,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {tabs.map(({ icon: Icon, label, href }) => {
        const isActive =
          pathname === href ||
          (href === "/assignments" && pathname.startsWith("/assignments"));
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5"
            style={{ color: isActive ? "var(--color-text-primary)" : "var(--color-text-subtle)" }}
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.75}
              style={{ color: isActive ? "var(--color-text-primary)" : "var(--color-text-subtle)" }}
            />
            <span
              className="text-xs"
              style={{
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-subtle)",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
