"use client";

import { buttonClass } from "@/components/ui";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={`${buttonClass} no-print`}>
      Print this page
    </button>
  );
}
