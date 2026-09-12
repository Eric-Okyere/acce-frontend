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
