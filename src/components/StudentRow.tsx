"use client";

import { useState, useTransition } from "react";
import { updateStudentAction, toggleUserActiveAction } from "@/app/actions/admin";
import { inputClass, secondaryButtonClass, buttonClass, Badge } from "@/components/ui";
import ResetDeviceButton from "@/components/ResetDeviceButton";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import DeleteStudentButton from "@/components/DeleteStudentButton";
import type { UserRow, SubjectRow, ProgramRow, DeviceRow } from "@/lib/types";

// One row of the admin Students table, plus its own expandable "Edit"
// panel (a second <tr> spanning every column) — kept as one client
// component per student so each row's edit/delete state is independent and
// the server component (app/admin/students/page.tsx) can stay a plain map().
export default function StudentRow({
  student,
  programs,
  subjects,
  device,
  path,
}: {
  student: UserRow;
  programs: ProgramRow[];
  subjects: SubjectRow[];
  device: DeviceRow | null;
  path: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name);
  const [phone, setPhone] = useState(student.phone);
  const [indexNumber, setIndexNumber] = useState(student.index_number ?? "");
  const [level, setLevel] = useState(student.level != null ? String(student.level) : "");
  const [programId, setProgramId] = useState(student.program_id ?? "");
  const [subjectIds, setSubjectIds] = useState<string[]>(student.enrolled_subject_ids);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const programName = programs.find((p) => p.id === student.program_id)?.name ?? "—";
  const enrolledNames = subjects
    .filter((s) => student.enrolled_subject_ids.includes(s.id))
    .map((s) => s.name);
  const editProgramSubjects = subjects.filter((s) => s.program_id === programId);

  function toggleSubject(id: string) {
    setSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
    setName(student.name);
    setPhone(student.phone);
    setIndexNumber(student.index_number ?? "");
    setLevel(student.level != null ? String(student.level) : "");
    setProgramId(student.program_id ?? "");
    setSubjectIds(student.enrolled_subject_ids);
  }

  return (
    <>
      <tr className="border-t border-slate-100">
        <td className="px-4 py-3">
          <div className="font-medium text-slate-900">{student.name}</div>
          <div className="text-xs text-slate-400">
            {student.index_number ?? "no index #"} · {student.phone}
          </div>
        </td>
        <td className="px-4 py-3 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span>{programName}</span>
            {student.level ? (
              <Badge tone="slate">Level {student.level}</Badge>
            ) : (
              <span className="text-xs text-slate-400" title="No level on file yet.">
                (no level)
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {enrolledNames.length > 0 ? (
              enrolledNames.map((n) => (
                <Badge key={n} tone="blue">
                  {n}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-slate-400" title="No specific courses on file — counted as offering every course in their program.">
                All (legacy)
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          {device?.device_id ? (
            <Badge tone="green">Bound{device.reset_count > 0 ? ` (reset ×${device.reset_count})` : ""}</Badge>
          ) : (
            <Badge tone="slate">Not yet bound</Badge>
          )}
        </td>
        <td className="px-4 py-3">
          {student.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Deactivated</Badge>}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Close" : "Edit"}
            </button>
            <ResetPasswordButton userId={student.id} userName={student.name} userPhone={student.phone} path={path} />
            {device?.device_id && <ResetDeviceButton studentId={student.id} studentName={student.name} path={path} />}
            <form action={toggleUserActiveAction.bind(null, student.id, !student.is_active, path)}>
              <button type="submit" className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}>
                {student.is_active ? "Deactivate" : "Reactivate"}
              </button>
            </form>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="border-t border-slate-100 bg-slate-50">
          <td colSpan={5} className="px-4 py-4">
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} text-sm`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} text-sm`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Index number</label>
                <input
                  value={indexNumber}
                  onChange={(e) => setIndexNumber(e.target.value)}
                  className={`${inputClass} text-sm`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Level</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className={`${inputClass} text-sm`}>
                  <option value="">Not set</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Program</label>
                <select
                  value={programId}
                  onChange={(e) => {
                    setProgramId(e.target.value);
                    setSubjectIds([]); // last program's courses no longer apply
                  }}
                  className={`${inputClass} text-sm`}
                >
                  <option value="" disabled>
                    Select a program…
                  </option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Courses offered</label>
                {editProgramSubjects.length === 0 ? (
                  <p className="text-xs text-slate-400">No courses in this program yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {editProgramSubjects.map((s) => (
                      <label key={s.id} className="flex items-center gap-1.5 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={subjectIds.includes(s.id)}
                          onChange={() => toggleSubject(s.id)}
                          className="rounded border-slate-300"
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Leaving none checked falls back to counting this student as offering every course in their program.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                disabled={pending || !name.trim() || !phone.trim() || !programId}
                className={`${buttonClass} !py-1.5 !px-4 text-xs`}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const res = await updateStudentAction(
                      student.id,
                      { name, phone, programId, indexNumber, level: level ? Number(level) : null, subjectIds },
                      path
                    );
                    if (res.error) setError(res.error);
                    else setEditing(false);
                  });
                }}
              >
                {pending ? "Saving…" : "Save changes"}
              </button>
              <button type="button" className={`${secondaryButtonClass} !py-1.5 !px-4 text-xs`} onClick={cancelEdit}>
                Cancel
              </button>
              <div className="ml-auto">
                <DeleteStudentButton userId={student.id} userName={student.name} path={path} />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </td>
        </tr>
      )}
    </>
  );
}
