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
  { href: "/settings", label: "Me", Icon: IconSettings },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-2 shadow-lg z-40">
      {NAV.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[10px] transition-colors ${
              active
                ? "bg-[var(--surface-2)] text-[var(--text)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            <Icon width={18} height={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
