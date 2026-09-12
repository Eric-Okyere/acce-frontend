import Link from "next/link";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { Card, PageHeader, StatTile } from "@/components/ui";
import LevelBreakdownTable from "@/components/LevelBreakdownTable";
import { levelLabel, parseLevelKey } from "@/lib/levels";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
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

  // "A level is selected and analysis is shown" — driven by ?level= on this
  // same page (a plain link/query-param filter, matching how
  // admin/reports.tsx already picks a subject) rather than client-side
  // state, since this stays a server component. undefined = "All levels"
  // (today's whole-school view, unchanged); otherwise every level-scoped
  // number below narrows to just that level.
  const { level: levelParam } = await searchParams;
  const selectedLevel = levelParam === undefined ? undefined : parseLevelKey(levelParam);
  const filtering = selectedLevel !== undefined;

  const subjectsAtLevel = filtering ? subjects.filter((s) => s.level === selectedLevel) : subjects;
  const studentsAtLevel = filtering ? students.filter((s) => s.level === selectedLevel) : students;
  const repsAtLevel = filtering ? reps.filter((r) => r.level === selectedLevel) : reps;
  const totalStudentsAtLevel = studentsAtLevel.length + repsAtLevel.length;
  // A teacher can teach several levels at once (different subjects, or one
  // combined class) — "Teachers" when filtered means "teaches at least one
  // subject at this level," not a partition, so a teacher covering two
  // levels rightly counts under both filters.
  const teacherIdsAtLevel = new Set(subjectsAtLevel.map((s) => s.teacher_id).filter((id): id is string => !!id));
  const teachersAtLevel = filtering ? teachers.filter((t) => teacherIdsAtLevel.has(t.id)) : teachers;

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        subtitle="Accra College of Education — attendance system overview"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatTile label="Programs" value={programs.length} hint={filtering ? "School-wide" : undefined} />
        <StatTile label="Courses" value={subjectsAtLevel.length} />
        <StatTile label="Teachers" value={teachersAtLevel.length} />
        <StatTile label="Course reps" value={repsAtLevel.length} />
        <StatTile label="Students" value={totalStudentsAtLevel} hint="Includes course reps" />
        <StatTile label="Lecture halls" value={halls.length} hint={filtering ? "School-wide" : undefined} />
      </div>

      {/* Every level is its own distinct cohort — nothing here lumps 100
          through 400 into one combined number. Programs and Lecture halls
          stay out of this table on purpose: neither is a level-scoped
          concept (a program spans every level, a hall is just a physical
          room), so a "by level" split of those would just repeat the same
          total in every row. Click a row (or "All levels") to filter the
          whole page — see the comment on `selectedLevel` above. */}
      <Card className="p-5 mb-8">
        <h2 className="font-semibold text-slate-900 mb-1">
          By level{filtering ? ` — ${levelLabel(selectedLevel!)}` : ""}
        </h2>
        <p className="text-xs text-slate-400 mb-3">
          Every level-scoped headcount on this dashboard, broken out — a course rep counts as both a
          course rep and a student, same as the totals above. Click a level to filter the page.
        </p>
        <LevelBreakdownTable
          linkBase="/admin"
          selectedLevel={selectedLevel}
          columns={[
            { key: "subjects", label: "Courses", items: subjects },
            { key: "students", label: "Students", items: [...students, ...reps] },
            { key: "courseReps", label: "Course reps", items: reps },
          ]}
        />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3">
            Quick setup checklist{filtering ? " (school-wide)" : ""}
          </h2>
          {/* Onboarding progress is about the whole school's setup, not one
              level at a time, so this stays unfiltered even when a level is
              selected above — the label just says so explicitly. */}
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
              label="At least one course created and assigned to a teacher"
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
