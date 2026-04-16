"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Calendar, Target, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Prédire", icon: Target },
  { href: "/matches", label: "Matchs", icon: Calendar },
  { href: "/players", label: "Joueurs", icon: Users },
  { href: "/model", label: "Modèle", icon: BarChart3 },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/80 backdrop-blur-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-xl grid-cols-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-xs transition",
                active ? "text-lime" : "text-muted",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
