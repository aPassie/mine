"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconSearch,
  IconSettings,
  IconShuffle,
  IconTag,
} from "./icons";

const NAV = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/shuffle", label: "Shuffle", Icon: IconShuffle },
  { href: "/search", label: "Search", Icon: IconSearch },
  { href: "/tags", label: "Tags", Icon: IconTag },
  { href: "/settings", label: "Settings", Icon: IconSettings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:flex-col w-[240px] shrink-0 border-r border-[var(--border)] px-4 py-6 gap-1">
      <div className="px-3 pb-6 select-none">
        <div className="text-lg font-semibold tracking-tight">Mine</div>
        <div className="text-xs text-[var(--text-muted)]">your second brain</div>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-[var(--surface-2)] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              }`}
            >
              <Icon className="shrink-0" width={16} height={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
