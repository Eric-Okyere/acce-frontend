// A small, honestly-labelled advertisement for Linkpii (linkpii.com), Eric's
// own classifieds/marketplace business — placed on the printed hall QR
// posters (app/admin/halls/[id]/print/page.tsx) since those are what
// students actually see and scan, repeatedly, all term. Deliberately styled
// as a light card with a thin border rather than a filled dark background,
// so it still looks right on paper: printed page backgrounds depend on the
// browser's own "print background graphics" setting (often off by default),
// but text color and the logo image itself always print regardless.
//
// Labelled "Advertisement" so it reads as sponsorship, not official ACCE
// content — kept honest and low-key rather than loud, since this shares
// space with a functional attendance QR code.
export default function LinkpiiAd() {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50/40 px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600/80 text-center mb-2">
        Advertisement
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/linkpii-logo.jpg"
        alt="Linkpii — Grow Your Business"
        className="w-20 h-20 mx-auto rounded-full object-cover mb-3"
      />
      <p className="text-sm font-semibold text-slate-900 text-center leading-snug mb-1">
        Need a laptop, calculator, or phone for school?
      </p>
      <p className="text-xs text-slate-600 text-center leading-relaxed mb-3">
        Buy laptops, calculators, iPhones, Android phones and all your other school
        essentials on <span className="font-semibold text-amber-700">Linkpii</span> — Ghana&apos;s
        marketplace to grow your business.
      </p>
      <p className="text-xs text-center font-medium text-amber-700">
        Visit linkpii.com or download the Linkpii app on Google Play &amp; the App Store
      </p>
    </div>
  );
}
