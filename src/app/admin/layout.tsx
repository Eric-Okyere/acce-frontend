import { requireSession } from "@/lib/guard";
import Nav from "@/components/Nav";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/programs", label: "Programs" },
  { href: "/admin/subjects", label: "Courses" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/course-reps", label: "Course reps" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/halls", label: "Lecture halls" },
  { href: "/admin/lectures", label: "Lectures" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit", label: "Audit log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["ADMIN"]);
  return (
    <div className="min-h-screen">
      <Nav items={NAV_ITEMS} name={session.name} roleLabel="Admin / Co-owner" />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
