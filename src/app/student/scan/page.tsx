import { PageHeader } from "@/components/ui";
import ScannerClient from "./ScannerClient";

export default function StudentScanPage() {
  return (
    <div>
      <PageHeader
        title="Check in / check out"
        subtitle="You must be physically inside the lecture hall — the QR code and your phone's location are both checked."
      />
      <ScannerClient />
    </div>
  );
}
