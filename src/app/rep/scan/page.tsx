import { PageHeader } from "@/components/ui";
import ScannerClient from "@/app/student/scan/ScannerClient";

// Course reps attend lectures in their own program just like students do, and
// check in the exact same way — same QR + geofence + index-number flow, same
// component. See routes/attendance.js on the backend (STUDENT and COURSE_REP
// are both accepted there) for why this isn't a separate implementation.
export default function RepScanPage() {
  return (
    <div>
      <PageHeader
        title="Check in"
        subtitle="You must be physically inside the lecture hall — the QR code and your phone's location are both checked."
      />
      <ScannerClient />
    </div>
  );
}
