import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import Nav from "@/components/Nav";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { session, token } = await requireSessionWithToken(["TEACHER"]);
  const subjects = await api.listSubjects(token, { teacherId: session.sub });

  const navItems = [
    { href: "/teacher", label: "Overview" },
    ...subjects.map((s) => ({ href: `/teacher/subjects/${s.id}`, label: s.name })),
  ];

  return (
    <div className="min-h-screen">
      <Nav items={navItems} name={session.name} roleLabel="Teacher" />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
