import { levelBreakdownTable, type LevelBreakdownColumn } from "@/lib/levels";

// One row per level (100 through 400, always shown — a level doesn't stop
// existing just because nothing's assigned to it yet — plus "Not set" when
// applicable), one column per named headcount. Used wherever a dashboard
// needs more than one level-scoped count shown together (e.g. Subjects,
// Students, Course reps all broken down by level side by side).
export default function LevelBreakdownTable({ columns }: { columns: LevelBreakdownColumn[] }) {
  const rows = levelBreakdownTable(columns);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-slate-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left py-2 pr-4 font-medium">Level</th>
            {columns.map((c) => (
              <th key={c.key} className="text-right py-2 pl-4 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-slate-100">
              <td className="py-2 pr-4 font-medium text-slate-900">{row.label}</td>
              {columns.map((c) => (
                <td key={c.key} className="py-2 pl-4 text-right tabular-nums text-slate-700">
                  {row.counts[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
