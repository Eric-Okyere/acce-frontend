import { requireSession } from "@/lib/guard";
import Nav from "@/components/Nav";

const NAV_ITEMS = [
  { href: "/rep", label: "Lectures" },
  { href: "/rep/lectures/new", label: "Schedule lecture" },
];

export default async function RepLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["COURSE_REP"]);
  return (
    <div className="min-h-screen">
      <Nav items={NAV_ITEMS} name={session.name} roleLabel="Course Rep" />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
