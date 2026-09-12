import Link from "next/link";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { Card, PageHeader, StatTile } from "@/components/ui";
import LevelBreakdownTable from "@/components/LevelBreakdownTable";

export default async function AdminDashboardPage() {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const [programs, subjects, teachers, reps, students, halls, recentAudit] = await Promise.all([
    api.listPrograms(token),
    api.listSubjects(token),
    api.listUsersByRole(token, "TEACHER"),
    api.listUsersByRole(token, "COURSE_REP"),
    api.listUsersByRole(token, "STUDENT"),
    api.listHalls(token),
    api.listRecentAudit(token, 8),
  ]);

  // A course rep IS a student (promoted from one, still attends/checks in
  // like one — see lib/enrollment.js) — just with added scheduling
  // responsibility for their assigned subject(s). "Students" on this
  // dashboard is a headcount of everyone who's a student in that sense, so
  // it adds the two roles together rather than only counting plain STUDENT
  // accounts. The Course reps tile stays alongside it as its own breakdown.
  const totalStudents = students.length + reps.length;

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        subtitle="Accra College of Education — attendance system overview"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatTile label="Programs" value={programs.length} />
        <StatTile label="Subjects" value={subjects.length} />
        <StatTile label="Teachers" value={teachers.length} />
        <StatTile label="Course reps" value={reps.length} />
        <StatTile label="Students" value={totalStudents} hint="Includes course reps" />
        <StatTile label="Lecture halls" value={halls.length} />
      </div>

      {/* Every level is its own distinct cohort — nothing here lumps 100
          through 400 into one combined number. Programs, Teachers, and
          Lecture halls stay out of this table on purpose: none of them is a
          level-scoped concept (a program spans every level, a teacher can
          teach several levels at once — see the teacher Students page — and
          a hall is just a physical room), so a "by level" split of those
          would just repeat the same total in every row. */}
      <Card className="p-5 mb-8">
        <h2 className="font-semibold text-slate-900 mb-1">By level</h2>
        <p className="text-xs text-slate-400 mb-3">
          Every level-scoped headcount on this dashboard, broken out — a course rep counts as both a
          course rep and a student, same as the totals above.
        </p>
        <LevelBreakdownTable
          columns={[
            { key: "subjects", label: "Subjects", items: subjects },
            { key: "students", label: "Students", items: [...students, ...reps] },
            { key: "courseReps", label: "Course reps", items: reps },
          ]}
        />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Quick setup checklist</h2>
          <ol className="space-y-2 text-sm">
            <ChecklistItem
              done={programs.length > 0}
              href="/admin/programs"
              label="Programs registered (Early Childhood, Primary, JHS)"
            />
            <ChecklistItem done={halls.length > 0} href="/admin/halls" label="At least one lecture hall created" />
            <ChecklistItem
              done={teachers.length > 0}
              href="/admin/teachers"
              label="At least one teacher registered"
            />
            <ChecklistItem
              done={subjects.length > 0}
              href="/admin/subjects"
              label="At least one subject created and assigned to a teacher"
            />
            <ChecklistItem
              done={reps.length > 0}
              href="/admin/course-reps"
              label="At least one course rep registered"
            />
            <ChecklistItem done={totalStudents > 0} href="/admin/students" label="Students registered" />
          </ol>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Recent activity</h2>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentAudit.map((a) => (
                <li key={a.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <span className="text-slate-700">{a.action.replaceAll("_", " ").toLowerCase()}</span>
                  <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/audit" className="text-sm text-blue-700 font-medium mt-3 inline-block">
            View full audit log →
          </Link>
        </Card>
      </div>
    </div>
  );
}

function ChecklistItem({ done, href, label }: { done: boolean; href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-2 hover:text-blue-700">
        <span
          className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
            done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
          }`}
        >
          {done ? "✓" : ""}
        </span>
        <span className={done ? "text-slate-500 line-through" : "text-slate-700"}>{label}</span>
      </Link>
    </li>
  );
}
