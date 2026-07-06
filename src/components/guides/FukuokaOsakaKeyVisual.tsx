const IMG_BASE = "/images/compare/fukuoka-vs-osaka";

/**
 * Fukuoka vs Osaka key visual — shared between the article
 * (pages/GuideFukuokaOsaka.tsx) and its /guides index card, so the index
 * thumbnail is the real composition (crisp at any size) instead of a
 * cropped raster cover image.
 *
 * Each illustration gets its own rect clipPath + preserveAspectRatio="...
 * slice" so it crops to fill its box exactly (matching the reference
 * design's tight, overlapping layout) instead of the SVG default
 * letterbox-and-center behavior, which shrank images whose native aspect
 * ratio didn't match their box (most visibly the tsutenkaku tower).
 */
export function FukuokaOsakaKeyVisual({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 506"
      width="100%"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="fo-cl">
          <polygon points="0,0 518,0 391,506 0,506" />
        </clipPath>
        <clipPath id="fo-cr">
          <polygon points="518,0 900,0 900,506 391,506" />
        </clipPath>
        <clipPath id="fo-clip-strawberry">
          <rect x="47" y="48" width="265" height="279" />
        </clipPath>
        <clipPath id="fo-clip-mentaiko">
          <rect x="180" y="240" width="208" height="119" />
        </clipPath>
        <clipPath id="fo-clip-tsutenkaku">
          <rect x="537" y="135" width="102" height="243" />
        </clipPath>
        <clipPath id="fo-clip-takoyaki">
          <rect x="585" y="0" width="307" height="270" />
        </clipPath>
      </defs>
      <polygon points="0,0 518,0 391,506 0,506" fill="#FDEBD0" />
      <polygon points="518,0 900,0 900,506 391,506" fill="#D6EAF8" />
      <line x1="518" y1="0" x2="391" y2="506" stroke="white" strokeWidth="6" />
      <g clipPath="url(#fo-cl)">
        <image
          href={`${IMG_BASE}/img-fukuoka-strawberry.png`}
          x="47"
          y="48"
          width="265"
          height="279"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#fo-clip-strawberry)"
        />
        <image
          href={`${IMG_BASE}/img-fukuoka-mentaiko.png`}
          x="180"
          y="240"
          width="208"
          height="119"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#fo-clip-mentaiko)"
        />
      </g>
      <g clipPath="url(#fo-cr)">
        <image
          href={`${IMG_BASE}/img-osaka-tsutenkaku.png`}
          x="537"
          y="135"
          width="102"
          height="243"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#fo-clip-tsutenkaku)"
        />
        <image
          href={`${IMG_BASE}/img-osaka-takoyaki.png`}
          x="585"
          y="0"
          width="307"
          height="270"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#fo-clip-takoyaki)"
        />
      </g>
      <circle cx="450" cy="294" r="47" fill="white" stroke="#0D0D0D" strokeWidth="3" />
      <text
        x="450"
        y="301"
        textAnchor="middle"
        fontFamily="'DM Sans',sans-serif"
        fontSize="24"
        fontWeight="700"
        fill="#0D0D0D"
      >
        V.S
      </text>
      <text
        x="87"
        y="450"
        fontFamily="'Noto Serif JP',Georgia,serif"
        fontSize="63"
        fontWeight="900"
        fill="#0D0D0D"
        letterSpacing="-2"
      >
        福岡
      </text>
      <text
        x="87"
        y="480"
        fontFamily="'DM Sans',sans-serif"
        fontSize="15"
        fontWeight="700"
        fill="#666"
        letterSpacing="5"
      >
        FUKUOKA
      </text>
      <text
        x="831"
        y="450"
        textAnchor="end"
        fontFamily="'Noto Serif JP',Georgia,serif"
        fontSize="63"
        fontWeight="900"
        fill="#0D0D0D"
        letterSpacing="-2"
      >
        大阪
      </text>
      <text
        x="831"
        y="480"
        textAnchor="end"
        fontFamily="'DM Sans',sans-serif"
        fontSize="15"
        fontWeight="700"
        fill="#666"
        letterSpacing="5"
      >
        OSAKA
      </text>
    </svg>
  );
}
