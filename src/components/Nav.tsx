"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

export interface NavItem {
  href: string;
  label: string;
}

// Picks the "most specific" matching nav item for the current path — e.g. on
// /rep/lectures/new, both "/rep" and "/rep/lectures/new" are valid prefix
// matches, but only the longer, more specific one should be highlighted.
function isActiveHref(pathname: string, href: string, items: NavItem[]): boolean {
  if (pathname === href) return true;
  if (href !== "/" && !href.endsWith("/") && pathname.startsWith(`${href}/`)) {
    // Only the longest matching item among all nav items wins, so a parent
    // route like "/rep" doesn't also light up while viewing "/rep/scan".
    const longestMatch = items
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return longestMatch?.href === href;
  }
  return false;
}

export default function Nav({
  items,
  name,
  roleLabel,
}: {
  items: NavItem[];
  name: string;
  roleLabel: string;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-10 no-print">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Image src="/brand/acce-crest-v3.png" alt="Accra College of Education crest" width={36} height={36} className="h-9 w-9 rounded-lg shadow-sm" priority />
            <span className="font-semibold text-sm text-slate-900 hidden sm:inline">ACCE Attendance</span>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {items.map((item) => {
              const active = isActiveHref(pathname, item.href, items);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 whitespace-nowrap"
                      : "px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-900 leading-tight">{name}</div>
              <div className="text-xs text-slate-500 leading-tight">{roleLabel}</div>
            </div>
            <Link href="/account/change-password" className="text-sm font-medium text-slate-500 hover:text-blue-700 px-2 py-1 hidden sm:inline">Password</Link>
            {/* A plain confirm() before submitting — Nav is already a client
                component (usePathname above), so this costs nothing extra.
                onSubmit runs before the server action fires; preventDefault()
                there stops it from ever being invoked, same as declining any
                other confirm-first destructive action in this app. */}
            <form
              action={logoutAction}
              onSubmit={(e) => {
                if (!window.confirm("Sign out of ACCE Attendance?")) {
                  e.preventDefault();
                }
              }}
            >
              <button type="submit" className="text-sm font-medium text-slate-500 hover:text-red-600 px-2 py-1">Sign out</button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
