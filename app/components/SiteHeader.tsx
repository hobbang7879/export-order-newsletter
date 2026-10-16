"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "목록" },
  { href: "/cards", label: "카드로 보기" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <span className="text-lg font-extrabold tracking-tight">
          수출<span className="text-blue-600">·</span>수주 <span className="text-blue-600">WEEKLY</span>
        </span>
        <nav className="flex gap-1 text-sm font-bold" aria-label="화면 바꾸기">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={pathname === tab.href ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 ${
                pathname === tab.href
                  ? "bg-blue-600 text-white"
                  : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
