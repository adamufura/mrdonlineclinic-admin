/** Lightweight SVG accent for the ministry admin dashboard hero. */
export function DashboardIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="dash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="dash-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <circle cx="260" cy="40" r="70" fill="url(#dash-grad)" />
      <circle cx="40" cy="160" r="50" fill="#0ea5e9" fillOpacity="0.08" />
      <rect x="48" y="52" width="200" height="120" rx="16" fill="white" fillOpacity="0.9" stroke="#e2e8f0" strokeWidth="1.5" />
      <path d="M72 88h120" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
      <path d="M72 108h88" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
      <path d="M72 128h64" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
      <circle cx="88" cy="72" r="14" fill="#14b8a6" fillOpacity="0.2" />
      <path
        d="M82 72h12M88 66v12"
        stroke="#0d9488"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="200" y="140" width="72" height="48" rx="10" fill="url(#dash-line)" fillOpacity="0.15" stroke="#14b8a6" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M212 158h48M212 172h32" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.5" />
      <path
        d="M120 24c20-12 48-8 56 12s-8 44-32 48-40-16-48-36 4-52 24z"
        fill="#14b8a6"
        fillOpacity="0.12"
      />
    </svg>
  );
}
