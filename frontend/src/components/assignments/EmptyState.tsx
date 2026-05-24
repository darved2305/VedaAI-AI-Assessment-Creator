import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 px-4">
      <NoAssignmentsIllustration />
      <h2
        className="mt-6 text-lg font-semibold"
        style={{ color: "var(--color-text-primary)" }}
      >
        No assignments yet
      </h2>
      <p
        className="mt-2 text-sm text-center max-w-xs"
        style={{ color: "var(--color-text-muted)", lineHeight: "1.6" }}
      >
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let AI
        assist with grading.
      </p>
      <Link
        href="/create"
        className="mt-8 flex items-center gap-2 px-6 py-3 text-sm font-medium"
        style={{
          background: "var(--color-btn-primary)",
          color: "var(--color-btn-primary-text)",
          borderRadius: "var(--radius-full)",
        }}
      >
        + Create Your First Assignment
      </Link>
    </div>
  );
}

function NoAssignmentsIllustration() {
  return (
    <svg width="200" height="170" viewBox="0 0 200 170" fill="none">
      <circle cx="100" cy="85" r="68" fill="#EBEBEB" />
      <rect x="62" y="38" width="76" height="95" rx="6" fill="white" stroke="#E0E0E0" strokeWidth="1.5" />
      <rect x="72" y="52" width="56" height="5" rx="2.5" fill="#C8C8C8" />
      <rect x="72" y="63" width="44" height="4" rx="2" fill="#D8D8D8" />
      <rect x="72" y="73" width="50" height="4" rx="2" fill="#D8D8D8" />
      <rect x="72" y="83" width="38" height="4" rx="2" fill="#D8D8D8" />
      <rect x="108" y="34" width="38" height="28" rx="5" fill="white" stroke="#E0E0E0" strokeWidth="1.5" />
      <rect x="114" y="40" width="26" height="3" rx="1.5" fill="#C8C8C8" />
      <rect x="114" y="47" width="18" height="3" rx="1.5" fill="#D8D8D8" />
      <circle cx="105" cy="98" r="28" fill="#F0F0F0" stroke="#E0E0E0" strokeWidth="1.5" />
      <circle cx="105" cy="98" r="28" fill="white" fillOpacity="0.5" />
      <line x1="90" y1="83" x2="120" y2="113" stroke="#CCCCCC" strokeWidth="2" strokeLinecap="round" />
      <line x1="120" y1="83" x2="90" y2="113" stroke="#CCCCCC" strokeWidth="2" strokeLinecap="round" />
      <circle cx="105" cy="98" r="20" fill="none" stroke="#D0D0D0" strokeWidth="2" />
      <path d="M94 87L116 109M116 87L94 109" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      <circle cx="67" cy="118" r="5" fill="#A5B4FC" />
      <circle cx="143" cy="55" r="4" fill="#93C5FD" />
      <path d="M140 120 L144 116 L148 120" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M80 32 L80 26 M77 29 L83 29" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
