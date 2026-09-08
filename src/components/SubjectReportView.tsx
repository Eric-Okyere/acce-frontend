"use client";

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
import type { SubjectReport } from "@/lib/types";
import { Card, StatTile, Badge } from "@/components/ui";
import { AT_RISK_THRESHOLD } from "@/lib/constants";

const COLORS = { present: "#059669", incomplete: "#d97706", absent: "#dc2626" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SubjectReportView({ report }: { report: SubjectReport }) {
  const trendData = report.lectureStats.map((l) => ({
    date: formatDate(l.startTime),
    rate: l.rate,
  }));

  const breakdownData = report.lectureStats.map((l) => ({
    date: formatDate(l.startTime),
    Present: l.present,
    Incomplete: l.incomplete,
    Absent: l.absent,
  }));

  const atRisk = report.studentStats.filter((s) => s.rate < AT_RISK_THRESHOLD && s.totalLectures > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Overall attendance" value={`${report.overallRate}%`} />
        <StatTile label="Lectures held" value={report.totalLecturesHeld} />
        <StatTile label="Students on roster" value={report.rosterSize} />
        <StatTile label="At-risk students" value={atRisk.length} hint={`< ${AT_RISK_THRESHOLD}% attendance`} />
      </div>

      {report.lectureStats.length === 0 ? (
        <Card className="p-6 text-center text-sm text-slate-500">
          No completed lectures yet for this subject — charts will appear once at least one lecture has ended.
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Attendance rate over time</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, "Present"]} />
                <Line type="monotone" dataKey="rate" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Per-lecture breakdown</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={breakdownData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Present" stackId="a" fill={COLORS.present} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Incomplete" stackId="a" fill={COLORS.incomplete} />
                <Bar dataKey="Absent" stackId="a" fill={COLORS.absent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Students</h3>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(toCsv(report))}`}
            download={`${report.subjectName.replace(/\s+/g, "_")}_attendance.csv`}
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
            <tbody>
              {report.studentStats.map((s) => (
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
          </table>
        </div>
      </Card>
    </div>
  );
}

function toCsv(report: SubjectReport): string {
  const header = ["Student", "Index Number", "Present", "Incomplete", "Absent", "Total Lectures", "Rate (%)"];
  const rows = report.studentStats.map((s) => [
    s.name,
    s.indexNumber ?? "",
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
