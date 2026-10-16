/**
 * The one empty-state picture for the whole app: a blank card on a soft green ground.
 * It shows no particular object, so it fits an empty list, empty search or empty inbox alike.
 * Drawn with theme tokens, so it follows the light and dark themes.
 */
export function EmptyIllustration({ className }: { className?: string }) {
  const sparkle = 'M0-9C1-2.5 2.5-1 9 0 2.5 1 1 2.5 0 9-1 2.5-2.5 1-9 0-2.5-1-1-2.5 0-9Z'

  return (
    <svg viewBox="0 0 220 170" fill="none" aria-hidden="true" className={className}>
      <ellipse cx="110" cy="88" rx="96" ry="66" className="fill-green-200" />
      <ellipse cx="110" cy="150" rx="58" ry="7" className="fill-navy-100" />

      {/* back card */}
      <rect
        x="70"
        y="26"
        width="92"
        height="108"
        rx="14"
        transform="rotate(8 116 80)"
        className="fill-surface stroke-navy-400"
        strokeWidth="2"
      />

      {/* front card with placeholder lines */}
      <g transform="rotate(-4 106 86)">
        <rect
          x="58"
          y="32"
          width="96"
          height="112"
          rx="14"
          className="fill-canvas stroke-brand"
          strokeWidth="2.5"
        />
        <circle cx="80" cy="56" r="9" className="fill-navy-100" />
        <rect x="96" y="50" width="42" height="5" rx="2.5" className="fill-navy-200" />
        <rect x="96" y="60" width="26" height="5" rx="2.5" className="fill-navy-100" />
        <rect
          x="72"
          y="82"
          width="68"
          height="44"
          rx="10"
          className="stroke-navy-400"
          strokeWidth="2"
          strokeDasharray="5 6"
          strokeLinecap="round"
        />
        <path
          d="M106 96v16M98 104h16"
          className="stroke-navy-400"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* accents */}
      <path d={sparkle} transform="translate(178 44)" className="fill-green-500" />
      <path d={sparkle} transform="translate(36 70) scale(0.6)" className="fill-green-500" />
      <circle cx="186" cy="104" r="4" className="fill-brand" />
      <circle cx="48" cy="118" r="3" className="fill-navy-400" />
    </svg>
  )
}
