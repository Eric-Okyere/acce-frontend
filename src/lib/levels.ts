// Shared helper for grouping/counting anything with a student-style `level`
// field (100/200/300/400, or null for "never set") — used by the admin
// dashboard, the teacher students page, and the subject attendance table,
// so "how many students at each level" is computed the same way everywhere.
export const STUDENT_LEVELS = [100, 200, 300, 400] as const;

export function levelLabel(level: number | null): string {
  return level == null ? "Level not set" : `Level ${level}`;
}

export interface LevelCount {
  level: number | null;
  label: string;
  count: number;
}

/** One entry per level (100, 200, 300, 400, then "not set"), in that order. */
export function countByLevel(items: { level: number | null }[]): LevelCount[] {
  const counts = new Map<number | null, number>();
  for (const item of items) {
    counts.set(item.level, (counts.get(item.level) ?? 0) + 1);
  }
  const order: (number | null)[] = [...STUDENT_LEVELS, null];
  return order.map((level) => ({ level, label: levelLabel(level), count: counts.get(level) ?? 0 }));
}

/** Groups items by level, in the same fixed order, omitting empty groups. */
export function groupByLevel<T extends { level: number | null }>(
  items: T[]
): { level: number | null; label: string; items: T[] }[] {
  const order: (number | null)[] = [...STUDENT_LEVELS, null];
  return order
    .map((level) => ({ level, label: levelLabel(level), items: items.filter((i) => i.level === level) }))
    .filter((g) => g.items.length > 0);
}

export interface LevelBreakdownColumn {
  key: string;
  label: string;
  items: { level: number | null }[];
}

export interface LevelBreakdownRow {
  level: number | null;
  label: string;
  counts: Record<string, number>;
}

/**
 * Multi-column version of countByLevel — one row per level, one count per
 * named column (e.g. Subjects / Students / Course reps), so a dashboard can
 * show every level-scoped headcount side by side instead of as separate
 * single-number widgets. Every level 100–400 is always a row, even if every
 * column is 0 for it — a level doesn't stop existing just because nothing is
 * assigned to it yet. The "not set" row only appears if at least one item in
 * any column actually has no level.
 */
export function levelBreakdownTable(columns: LevelBreakdownColumn[]): LevelBreakdownRow[] {
  const hasUnset = columns.some((c) => c.items.some((i) => i.level == null));
  const order: (number | null)[] = hasUnset ? [...STUDENT_LEVELS, null] : [...STUDENT_LEVELS];
  return order.map((level) => ({
    level,
    label: levelLabel(level),
    counts: Object.fromEntries(columns.map((c) => [c.key, c.items.filter((i) => i.level === level).length])),
  }));
}
