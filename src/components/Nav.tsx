import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export interface NavItem {
  href: string;
  label: string;
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
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-10 no-print">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            {/* Filename is versioned (…-v3) so a browser/CDN that already cached
                an old logo under a previous filename can never serve that
                stale image here — this path has never existed before, so the
                request is guaranteed to hit the new file. Bump the suffix
                again on any future crest change. */}
            <Image
              src="/brand/acce-crest-v3.png"
              alt="Accra College of Education crest"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg shadow-sm"
              priority
            />
            <span className="font-semibold text-sm text-slate-900 hidden sm:inline">
              ACCE Attendance
            </span>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-900 leading-tight">{name}</div>
              <div className="text-xs text-slate-500 leading-tight">{roleLabel}</div>
            </div>
            <Link
              href="/account/change-password"
              className="text-sm font-medium text-slate-500 hover:text-blue-700 px-2 py-1 hidden sm:inline"
            >
              Password
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm font-medium text-slate-500 hover:text-red-600 px-2 py-1"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
