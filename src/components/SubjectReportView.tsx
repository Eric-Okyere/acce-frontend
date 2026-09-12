"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { SubjectReport, StudentStat } from "@/lib/types";
import { Card, StatTile, Badge } from "@/components/ui";
import { AT_RISK_THRESHOLD } from "@/lib/constants";
import { groupByLevel, levelKey, levelLabel, parseLevelKey } from "@/lib/levels";
import LevelBreakdown from "@/components/LevelBreakdown";

const ALL_LEVELS = "all";
const EMPTY_LEVEL_STAT = { present: 0, incomplete: 0, absent: 0, total: 0, rate: 0 };

const COLORS = { present: "#059669", incomplete: "#d97706", absent: "#dc2626" };
const SERIES: { key: "Present" | "Incomplete" | "Absent"; color: string }[] = [
  { key: "Present", color: COLORS.present },
  { key: "Incomplete", color: COLORS.incomplete },
  { key: "Absent", color: COLORS.absent },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// One tooltip listing every series at that point, value leading (bold,
// high-contrast) with the series name secondary, and a short line/swatch
// keying each row to its series color rather than a full filled box.
function ChartTooltip({
  active,
  label,
  payload,
  unit,
}: {
  active?: boolean;
  label?: string;
  payload?: { name?: string; value?: number | string; color?: string }[];
  unit?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
      <div className="font-medium text-slate-500 mb-1">{label}</div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-0.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-semibold text-slate-900 tabular-nums">
              {entry.value}
              {unit ?? ""}
            </span>
            <span className="text-slate-500">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SubjectReportView({ report }: { report: SubjectReport }) {
  // "A level is selected and analysis is shown" — every stat tile, both
  // charts, the roster table, and the CSV export below all key off this one
  // piece of state. "all" (the default, unchanged from before this filter
  // existed) keeps today's combined view; picking a specific level narrows
  // every one of those to just that level's students, using the backend's
  // per-level breakdown (LectureStat.byLevel — see routes/reports.js) for
  // the charts and a plain filter of studentStats for everything else.
  const [selectedLevel, setSelectedLevel] = useState<string>(ALL_LEVELS);

  // Only offer levels that actually have at least one student on this
  // subject's roster — never an always-empty option.
  const availableLevels = groupByLevel(report.studentStats).map((g) => ({
    key: levelKey(g.level),
    label: g.label,
    count: g.items.length,
  }));

  const filteredStudents =
    selectedLevel === ALL_LEVELS
      ? report.studentStats
      : report.studentStats.filter((s) => levelKey(s.level) === selectedLevel);

  const trendData = report.lectureStats.map((l) => ({
    date: formatDate(l.startTime),
    rate: selectedLevel === ALL_LEVELS ? l.rate : (l.byLevel[selectedLevel] ?? EMPTY_LEVEL_STAT).rate,
  }));

  const breakdownData = report.lectureStats.map((l) => {
    const stat = selectedLevel === ALL_LEVELS ? l : (l.byLevel[selectedLevel] ?? EMPTY_LEVEL_STAT);
    return {
      date: formatDate(l.startTime),
      Present: stat.present,
      Incomplete: stat.incomplete,
      Absent: stat.absent,
    };
  });

  // Click a legend entry to toggle that series off/on in the stacked bar —
  // the bar itself is only omitted from the JSX (not just visually hidden),
  // so the remaining series restack correctly rather than leaving a gap.
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  function toggleSeries(key: string) {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function groupRate(students: StudentStat[]) {
    const present = students.reduce((sum, s) => sum + s.present, 0);
    const slots = students.reduce((sum, s) => sum + s.totalLectures, 0);
    return slots > 0 ? Math.round((present / slots) * 1000) / 10 : 0;
  }

  const atRisk = filteredStudents.filter((s) => s.rate < AT_RISK_THRESHOLD && s.totalLectures > 0);
  const overallRate = selectedLevel === ALL_LEVELS ? report.overallRate : groupRate(filteredStudents);

  // A subject/teacher can have students across several levels at once (a
  // combined class) — group the roster table by level rather than listing
  // everyone flat, with each group's own attendance subtotal. When a
  // specific level is selected this naturally collapses to one group.
  const levelGroups = groupByLevel(filteredStudents);

  return (
    <div className="space-y-6">
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <label htmlFor="level-filter" className="text-sm font-medium text-slate-700">
          Level
        </label>
        <select
          id="level-filter"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white text-sm px-3 py-1.5"
        >
          <option value={ALL_LEVELS}>All levels ({report.studentStats.length})</option>
          {availableLevels.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label} ({l.count})
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          Every stat, chart, and export below reflects the selected level.
        </span>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Overall attendance" value={`${overallRate}%`} />
        <StatTile label="Lectures held" value={report.totalLecturesHeld} />
        <StatTile label="Students on roster" value={filteredStudents.length} />
        <StatTile label="At-risk students" value={atRisk.length} hint={`< ${AT_RISK_THRESHOLD}% attendance`} />
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Students by level</h3>
        <LevelBreakdown items={report.studentStats} />
      </Card>

      {report.lectureStats.length === 0 ? (
        <Card className="p-6 text-center text-sm text-slate-500">
          No completed lectures yet for this subject — charts will appear once at least one lecture has ended.
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Attendance rate over time</h3>
            {/* syncId ties this chart's crosshair/tooltip to the breakdown
                chart below — both plot the same lecture dates, so hovering
                either one highlights the matching point on both. */}
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{ left: -20 }} syncId="subject-attendance">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" unit="%" />
                <Tooltip content={<ChartTooltip unit="%" />} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Attendance rate"
                  stroke="#1d4ed8"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Per-lecture breakdown</h3>
              <span className="text-xs text-slate-400">Click a series below to toggle it</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={breakdownData} margin={{ left: -20 }} syncId="subject-attendance">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
                {/* A fully custom legend rather than Recharts' built-in one:
                    its default legend auto-derives its entries from whichever
                    <Bar> children are actually mounted below — so a
                    toggled-off series would disappear from the legend
                    entirely instead of showing struck-through, leaving no way
                    to click it back on. Real <button>s here also give this
                    proper keyboard focus, which the built-in legend's onClick
                    doesn't. */}
                <Legend
                  content={() => (
                    <div className="flex items-center justify-center gap-4 mt-2">
                      {SERIES.map((s) => {
                        const hidden = hiddenSeries.has(s.key);
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => toggleSeries(s.key)}
                            aria-pressed={!hidden}
                            className="flex items-center gap-1.5 text-xs cursor-pointer"
                          >
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-sm"
                              style={{ backgroundColor: hidden ? "#cbd5e1" : s.color }}
                            />
                            <span className={hidden ? "text-slate-300 line-through" : "text-slate-600"}>{s.key}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {SERIES.filter((s) => !hiddenSeries.has(s.key)).map((s, i, visible) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    stackId="a"
                    fill={s.color}
                    radius={i === visible.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    activeBar={{ stroke: "#1e293b", strokeWidth: 1.5 }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Students</h3>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(toCsv(filteredStudents))}`}
            download={`${report.subjectName.replace(/\s+/g, "_")}_attendance_${
              selectedLevel === ALL_LEVELS
                ? "all_levels"
                : levelLabel(parseLevelKey(selectedLevel)).replace(/\s+/g, "_")
            }.csv`}
            className="text-sm text-blue-700 font-medium"
          >
            Export CSV
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left py-2 font-medium">Student</th>
                <th className="text-left py-2 font-medium">Index #</th>
                <th className="text-right py-2 font-medium">Present</th>
                <th className="text-right py-2 font-medium">Incomplete</th>
                <th className="text-right py-2 font-medium">Absent</th>
                <th className="text-right py-2 font-medium">Rate</th>
              </tr>
            </thead>
            {levelGroups.map((group) => (
              <tbody key={group.label}>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td colSpan={6} className="py-1.5 px-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {group.label} · {group.items.length} student{group.items.length === 1 ? "" : "s"} ·{" "}
                    {groupRate(group.items)}% avg
                  </td>
                </tr>
                {group.items.map((s) => (
                  <tr key={s.studentId} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-900">{s.name}</td>
                    <td className="py-2 text-slate-500">{s.indexNumber ?? "—"}</td>
                    <td className="py-2 text-right text-emerald-700">{s.present}</td>
                    <td className="py-2 text-right text-amber-700">{s.incomplete}</td>
                    <td className="py-2 text-right text-red-700">{s.absent}</td>
                    <td className="py-2 text-right">
                      {s.totalLectures === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : s.rate < AT_RISK_THRESHOLD ? (
                        <Badge tone="red">{s.rate}%</Badge>
                      ) : (
                        <Badge tone="green">{s.rate}%</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </Card>
    </div>
  );
}

// Takes the already level-filtered student list — see the "Export CSV" link
// above, which is the only caller — so the downloaded file always matches
// exactly what's on screen (and in the level <select>) at the time it's
// clicked, per "CSV must also be exported according to levels."
function toCsv(students: StudentStat[]): string {
  const header = ["Student", "Index Number", "Level", "Present", "Incomplete", "Absent", "Total Lectures", "Rate (%)"];
  const rows = students.map((s) => [
    s.name,
    s.indexNumber ?? "",
    s.level ?? "",
    s.present,
    s.incomplete,
    s.absent,
    s.totalLectures,
    s.rate,
  ]);
  return [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
}

function csvEscape(v: string | number): string {
  const str = String(v);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
