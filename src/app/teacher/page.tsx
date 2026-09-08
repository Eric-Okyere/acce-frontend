import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { PageHeader, Card } from "@/components/ui";

export default async function TeacherOverviewPage() {
  const { session, token } = await requireSessionWithToken(["TEACHER"]);
  const subjects = await api.listSubjects(token, { teacherId: session.sub });

  if (subjects.length === 1) {
    redirect(`/teacher/subjects/${subjects[0].id}`);
  }

  return (
    <div>
      <PageHeader title="Your subjects" subtitle="Pick a subject to see its attendance dashboard." />
      {subjects.length === 0 ? (
        <p className="text-sm text-slate-500">
          You haven&apos;t been assigned to any subjects yet — ask an admin to assign you to one.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <Link key={s.id} href={`/teacher/subjects/${s.id}`}>
              <Card className="p-5 hover:border-blue-300 transition">
                <h3 className="font-medium text-slate-900">{s.name}</h3>
                {s.code && <p className="text-xs text-slate-400 mt-0.5">{s.code}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
