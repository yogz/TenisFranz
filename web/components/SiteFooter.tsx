"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/behind-the-scenes")) return null;
  return (
    <footer className="mt-16 border-t border-border/60 pt-5 text-center">
      <Link
        href="/behind-the-scenes"
        className="text-xs text-muted/70 transition hover:text-text"
      >
        Behind the scenes
      </Link>
    </footer>
  );
}
