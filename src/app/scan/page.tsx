import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { roleHome } from "@/lib/guard";
import { PageHeader } from "@/components/ui";
import ScannerClient from "@/app/student/scan/ScannerClient";

// Universal landing point for a hall's QR code (see backend/src/lib/qr.js —
// the printed/displayed QR now encodes a link here, /scan?token=…, rather
// than raw signed-token text). This lets ANY camera app open straight to the
// check-in form, not just this app's own in-page scanner — the whole reason
// this route exists is the confusion of someone scanning with their phone's
// default camera and getting nothing but a "copy text" offer.
//
// No parent layout (no Nav) on purpose: someone can land here with no
// existing app "session feel" at all — fresh phone, first scan of the term —
// so this has to work as a self-contained page, not assume the person is
// already deep in the app's own navigation.
export default async function ScanEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const session = await getSession();
  if (!session) {
    // Preserve the token through the login round-trip so the person doesn't
    // have to scan again after signing in — see actions/auth.ts's
    // loginAction and login/LoginForm.tsx for the other half of this.
    const next = token ? `/scan?token=${encodeURIComponent(token)}` : "/scan";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  // Only students and course reps ever check in to a lecture themselves —
  // an admin or teacher scanning a hall poster (out of curiosity, testing,
  // whatever) should just land back on their own dashboard, not a form that
  // will only ever reject them.
  if (session.role !== "STUDENT" && session.role !== "COURSE_REP") {
    redirect(roleHome(session.role));
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <PageHeader
        title="Check in"
        subtitle="You must be physically inside the lecture hall — the QR code and your phone's location are both checked."
      />
      <ScannerClient initialToken={token} homeHref={roleHome(session.role)} />
    </div>
  );
}
