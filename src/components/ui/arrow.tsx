/**
 * Directional arrow that automatically flips in RTL layouts.
 * Use instead of &rarr; / &larr; HTML entities which don't respect dir="rtl".
 */

interface ArrowProps {
  /** "end" = points toward logical end (right in LTR, left in RTL). Default. */
  /** "start" = points toward logical start (left in LTR, right in RTL). */
  direction?: "end" | "start";
  className?: string;
}

export function Arrow({ direction = "end", className = "" }: ArrowProps) {
  // "end" arrow: points right in LTR, flips to left in RTL via rtl:-scale-x-100
  // "start" arrow: points left in LTR, flips to right in RTL via rtl:-scale-x-100
  const flip = direction === "start" ? "-scale-x-100 rtl:scale-x-100" : "rtl:-scale-x-100";

  return (
    <svg
      className={`inline-block w-4 h-4 ${flip} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
      />
    </svg>
  );
}
