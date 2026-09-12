// Shown automatically by Next.js while a route segment's page (and any
// nested layout/page below it) is still loading — see the loading.tsx files
// in app/admin, app/teacher, app/rep, app/student, app/register and app/scan.
// Kept as a small shared component so the spinner looks the same everywhere.
export default function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-blue-700 animate-spin"
          role="status"
          aria-label={label}
        />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
