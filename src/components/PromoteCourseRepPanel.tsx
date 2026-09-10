"use client";

import { useMemo, useState, useTransition } from "react";
import { promoteCourseRepAction } from "@/app/actions/admin";
import { inputClass, buttonClass } from "@/components/ui";

// Promotes an existing student to course rep, assigning the one subject
// they'll be responsible for — replaces the old direct "register a course
// rep" form (see routes/users.js: course reps are no longer created
// directly). The subject list is scoped to whichever student is currently
// selected, since a rep can only be assigned a subject from their own
// program. Driven manually (rather than via ActionForm/useActionState) so a
// successful submit can reset both the student and subject selects at once
// without syncing state through an effect.
export default function PromoteCourseRepPanel({
  students,
  subjects,
}: {
  students: { id: string; name: string; indexNumber: string | null; programId: string | null }[];
  subjects: { id: string; name: string; programId: string }[];
}) {
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  const selectedStudent = students.find((s) => s.id === studentId) ?? null;
  const availableSubjects = useMemo(
    () => (selectedStudent ? subjects.filter((sub) => sub.programId === selectedStudent.programId) : []),
    [selectedStudent, subjects]
  );

  return (
    <div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
          <select
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              setSubjectId("");
            }}
            className={inputClass}
          >
            <option value="">Select a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.indexNumber ? ` (${s.indexNumber})` : " (no index #)"}
              </option>
            ))}
          </select>
          {students.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">
              No students registered yet — register one from the Students page first.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Responsible subject</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!selectedStudent}
            className={inputClass}
          >
            <option value="">{selectedStudent ? "Select a subject…" : "Pick a student first…"}</option>
            {availableSubjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          {selectedStudent && availableSubjects.length === 0 && (
            <p className="text-xs text-amber-700 mt-1">
              No subjects exist for this student&apos;s program yet — create one on the Subjects page first.
            </p>
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
        disabled={pending || !studentId || !subjectId}
        className={`${buttonClass} mt-3`}
        onClick={() => {
          setResult({});
          startTransition(async () => {
            const fd = new FormData();
            fd.set("studentId", studentId);
            fd.set("subjectId", subjectId);
            const res = await promoteCourseRepAction({}, fd);
            setResult(res);
            if (res.success) {
              setStudentId("");
              setSubjectId("");
            }
          });
        }}
      >
        {pending ? "Promoting…" : "Promote to course rep"}
      </button>
    </div>
  );
}
