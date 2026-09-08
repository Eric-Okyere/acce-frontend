import { requireSession } from "@/lib/guard";
import Nav from "@/components/Nav";

const NAV_ITEMS = [
  { href: "/student", label: "My attendance" },
  { href: "/student/scan", label: "Scan to check in / out" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["STUDENT"]);
  return (
    <div className="min-h-screen">
      <Nav items={NAV_ITEMS} name={session.name} roleLabel="Student" />
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
