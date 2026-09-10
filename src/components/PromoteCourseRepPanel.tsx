"use client";

import { useMemo, useState, useTransition } from "react";
import { promoteCourseRepAction } from "@/app/actions/admin";
import { buttonClass } from "@/components/ui";
import StudentSearchSelect from "@/components/StudentSearchSelect";

// Promotes an existing student to course rep, assigning one or more subjects
// they'll be responsible for — replaces the old direct "register a course
// rep" form (see routes/users.js: course reps are no longer created
// directly). A course rep can be responsible for more than one course, so
// the subject list is a checkbox group, scoped to whichever student is
// currently selected (a rep can only be assigned subjects from their own
// program). Driven manually (rather than via ActionForm/useActionState) so a
// successful submit can reset the student and subject selections at once
// without syncing state through an effect.
export default function PromoteCourseRepPanel({
  students,
  subjects,
}: {
  students: { id: string; name: string; indexNumber: string | null; programId: string | null }[];
  subjects: { id: string; name: string; programId: string }[];
}) {
  const [studentId, setStudentId] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  const selectedStudent = students.find((s) => s.id === studentId) ?? null;
  const availableSubjects = useMemo(
    () => (selectedStudent ? subjects.filter((sub) => sub.programId === selectedStudent.programId) : []),
    [selectedStudent, subjects]
  );

  function toggleSubject(subjectId: string) {
    setSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  }

  return (
    <div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
          <StudentSearchSelect
            students={students.map((s) => ({ id: s.id, name: s.name, indexNumber: s.indexNumber }))}
            value={studentId}
            onChange={(id) => {
              setStudentId(id);
              setSubjectIds([]);
            }}
          />
          {students.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">
              No students registered yet — register one from the Students page first.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Responsible subject(s)</label>
          {!selectedStudent ? (
            <p className="text-xs text-slate-400">Pick a student first…</p>
          ) : availableSubjects.length === 0 ? (
            <p className="text-xs text-amber-700">
              No subjects exist for this student&apos;s program yet — create one on the Subjects page first.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {availableSubjects.map((sub) => (
                <label key={sub.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={subjectIds.includes(sub.id)}
                    onChange={() => toggleSubject(sub.id)}
                    className="rounded border-slate-300"
                  />
                  {sub.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      {result.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
          {result.error}
        </p>
      )}
      {result.success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-3">
          {result.success}
        </p>
      )}
      <button
        type="button"
        disabled={pending || !studentId || subjectIds.length === 0}
        className={`${buttonClass} mt-3`}
        onClick={() => {
          setResult({});
          startTransition(async () => {
            const fd = new FormData();
            fd.set("studentId", studentId);
            subjectIds.forEach((id) => fd.append("subjectIds", id));
            const res = await promoteCourseRepAction({}, fd);
            setResult(res);
            if (res.success) {
              setStudentId("");
              setSubjectIds([]);
            }
          });
        }}
      >
        {pending ? "Promoting…" : "Promote to course rep"}
      </button>
    </div>
  );
}
