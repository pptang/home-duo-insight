/**
 * Minato vs Chuo key visual — shared between the article
 * (pages/GuideMinatoChuo.tsx) and its /guides index card. Unlike the
 * Fukuoka/Osaka key visual, this one is pure vector (no raster illustrations):
 * a diagonal split with abstract tower-line marks suggesting Azabudai Hills
 * on the Minato side, and an arch-bridge silhouette suggesting Nihonbashi
 * (with a fading expressway above it, nodding to the planned undergrounding)
 * on the Chuo side.
 */
export function MinatoChuoKeyVisual({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 360"
      width="100%"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="mc-cl">
          <polygon points="0,0 486,0 432,360 0,360" />
        </clipPath>
        <clipPath id="mc-cr">
          <polygon points="498,0 900,0 900,360 444,360" />
        </clipPath>
      </defs>

      {/* Minato: deep blue */}
      <polygon points="0,0 486,0 432,360 0,360" fill="#1A3A5C" />
      {/* Chuo: warm gold */}
      <polygon points="498,0 900,0 900,360 444,360" fill="#7A5200" />

      {/* Minato side: abstract tower lines suggesting Azabudai Hills */}
      <g clipPath="url(#mc-cl)" opacity="0.18">
        <rect x="80" y="60" width="28" height="260" fill="white" rx="3" />
        <rect x="120" y="100" width="18" height="220" fill="white" rx="3" />
        <rect x="150" y="40" width="40" height="280" fill="white" rx="3" />
        <rect x="204" y="120" width="14" height="180" fill="white" rx="3" />
        <rect x="230" y="80" width="22" height="240" fill="white" rx="3" />
        <rect x="270" y="150" width="12" height="150" fill="white" rx="3" />
        <rect x="300" y="60" width="30" height="270" fill="white" rx="3" />
        <rect x="345" y="110" width="16" height="210" fill="white" rx="3" />
      </g>

      {/* Chuo side: arch bridge shape suggesting Nihonbashi */}
      <g clipPath="url(#mc-cr)" opacity="0.18">
        <path d="M520,280 Q620,160 720,280" stroke="white" strokeWidth="8" fill="none" />
        <path d="M540,280 Q640,180 740,280" stroke="white" strokeWidth="4" fill="none" />
        <line x1="560" y1="200" x2="560" y2="280" stroke="white" strokeWidth="3" />
        <line x1="600" y1="175" x2="600" y2="280" stroke="white" strokeWidth="3" />
        <line x1="640" y1="168" x2="640" y2="280" stroke="white" strokeWidth="3" />
        <line x1="680" y1="175" x2="680" y2="280" stroke="white" strokeWidth="3" />
        <line x1="720" y1="200" x2="720" y2="280" stroke="white" strokeWidth="3" />
        <rect x="520" y="278" width="240" height="10" fill="white" rx="2" />
        {/* Expressway above bridge, fading out — symbol of undergrounding */}
        <rect x="510" y="140" width="260" height="14" fill="white" rx="2" opacity="0.5" />
        {/* Arrow pointing down = expressway going underground */}
        <line x1="640" y1="158" x2="640" y2="175" stroke="white" strokeWidth="2" opacity="0.7" />
        <polygon points="635,173 640,182 645,173" fill="white" opacity="0.7" />
      </g>

      {/* VS badge */}
      <circle cx="450" cy="180" r="30" fill="white" stroke="#0D0D0D" strokeWidth="3" />
      <text
        x="450"
        y="186"
        textAnchor="middle"
        fontFamily="'DM Sans',sans-serif"
        fontSize="15"
        fontWeight="700"
        fill="#0D0D0D"
      >
        VS
      </text>

      {/* Left: Minato */}
      <text
        x="22"
        y="308"
        fontFamily="'Noto Serif JP',Georgia,serif"
        fontSize="60"
        fontWeight="900"
        fill="white"
        letterSpacing="-2"
        opacity="0.95"
      >
        港区
      </text>
      <text
        x="26"
        y="336"
        fontFamily="'DM Sans',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="white"
        letterSpacing="5"
        opacity="0.7"
      >
        MINATO-KU
      </text>

      {/* Right: Chuo */}
      <text
        x="878"
        y="308"
        textAnchor="end"
        fontFamily="'Noto Serif JP',Georgia,serif"
        fontSize="60"
        fontWeight="900"
        fill="white"
        letterSpacing="-2"
        opacity="0.95"
      >
        中央区
      </text>
      <text
        x="874"
        y="336"
        textAnchor="end"
        fontFamily="'DM Sans',sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="white"
        letterSpacing="5"
        opacity="0.7"
      >
        CHUO-KU
      </text>
    </svg>
  );
}
