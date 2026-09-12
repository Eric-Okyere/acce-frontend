import { countByLevel } from "@/lib/levels";

// A compact "N students at each level" row of chips — shared by the admin
// dashboard, the teacher students page, and the subject attendance
// dashboard. Zero-count levels are hidden by default so a teacher who only
// has 100- and 200-level students doesn't see two pointless "0" chips.
export default function LevelBreakdown({
  items,
  hideEmpty = true,
}: {
  items: { level: number | null }[];
  hideEmpty?: boolean;
}) {
  const counts = countByLevel(items);
  const visible = hideEmpty ? counts.filter((c) => c.count > 0) : counts;

  if (visible.length === 0) {
    return <p className="text-sm text-slate-400">No students yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((c) => (
        <span
          key={c.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
        >
          <span className="font-semibold text-slate-900 tabular-nums">{c.count}</span>
          {c.label}
        </span>
      ))}
    </div>
  );
}
