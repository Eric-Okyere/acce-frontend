import Link from "next/link";
import { levelBreakdownTable, levelKey, type LevelBreakdownColumn } from "@/lib/levels";

// One row per level (100 through 400, always shown — a level doesn't stop
// existing just because nothing's assigned to it yet — plus "Not set" when
// applicable), one column per named headcount. Used wherever a dashboard
// needs more than one level-scoped count shown together (e.g. Subjects,
// Students, Course reps all broken down by level side by side).
//
// Pass `linkBase` to turn the table itself into the level filter control:
// each row (and a leading "All levels" row) becomes a link to
// `${linkBase}?level=<key>`, and `selectedLevel` (undefined for "all levels")
// highlights the currently active row — "a level is selected and analysis is
// shown" without a separate row of filter pills.
export default function LevelBreakdownTable({
  columns,
  linkBase,
  selectedLevel,
}: {
  columns: LevelBreakdownColumn[];
  linkBase?: string;
  selectedLevel?: number | null;
}) {
  const rows = levelBreakdownTable(columns);
  const isFilterable = linkBase != null;

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
          {isFilterable && (
            <tr className={`border-t border-slate-100 ${selectedLevel === undefined ? "bg-blue-50" : ""}`}>
              <td className="py-2 pr-4 font-medium">
                <Link href={linkBase!} className="text-blue-700 hover:underline">
                  All levels
                </Link>
              </td>
              {columns.map((c) => (
                <td key={c.key} className="py-2 pl-4 text-right tabular-nums text-slate-700">
                  {c.items.length}
                </td>
              ))}
            </tr>
          )}
          {rows.map((row) => {
            const active = isFilterable && selectedLevel === row.level;
            return (
              <tr key={row.label} className={`border-t border-slate-100 ${active ? "bg-blue-50" : ""}`}>
                <td className="py-2 pr-4 font-medium text-slate-900">
                  {isFilterable ? (
                    <Link href={`${linkBase}?level=${levelKey(row.level)}`} className="text-blue-700 hover:underline">
                      {row.label}
                    </Link>
                  ) : (
                    row.label
                  )}
                </td>
                {columns.map((c) => (
                  <td key={c.key} className="py-2 pl-4 text-right tabular-nums text-slate-700">
                    {row.counts[c.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
