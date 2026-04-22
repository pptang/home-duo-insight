import { Crown } from 'lucide-react';

export interface WinnerBannerAxisScores {
  price: number;    // 0-100
  location: number; // 0-100
  building: number; // 0-100
}

export interface WinnerBannerProperty {
  name: string;
  price: string; // already formatted, e.g. "¥5,980万"
  totalScore?: number;               // 0-100 AI composite score
  axisScores?: WinnerBannerAxisScores; // per-axis breakdown
  reason?: string;                   // sub-meta shown on winner side only
}

interface WinnerBannerProps {
  propertyA: WinnerBannerProperty;
  propertyB: WinnerBannerProperty;
  winner: 'A' | 'B' | 'draw';
  verdictTag?: string; // short label shown on winner side, e.g. "AI 推奨"
}

export const WinnerBanner = ({
  propertyA,
  propertyB,
  winner,
  verdictTag = 'AI 推奨',
}: WinnerBannerProps) => (
  <div className="score-duel" role="group" aria-label="比較結果">
    <Side
      label="物件 A"
      property={propertyA}
      winner={winner === 'A'}
      draw={winner === 'draw'}
      verdictTag={verdictTag}
    />
    <Side
      label="物件 B"
      property={propertyB}
      winner={winner === 'B'}
      draw={winner === 'draw'}
      verdictTag={verdictTag}
    />
  </div>
);

interface SideProps {
  label: string;
  property: WinnerBannerProperty;
  winner: boolean;
  draw: boolean;
  verdictTag: string;
}

const AXIS_LABELS: Record<keyof WinnerBannerAxisScores, string> = {
  price: '価格',
  location: '立地',
  building: '建物',
};

const Side = ({ label, property, winner, draw, verdictTag }: SideProps) => {
  const { totalScore, axisScores, reason } = property;
  const hasScore = totalScore !== undefined;
  const hasAxes = axisScores !== undefined;

  return (
    <div
      className={`duel-side ${winner ? 'winner' : draw ? '' : 'loser'}`}
      aria-current={winner ? 'true' : undefined}
    >
      {winner && (
        <div className="absolute top-3 right-3 text-label-xs border border-paper/25 text-paper/80 px-2 py-1 rounded-sm flex items-center gap-1">
          <Crown className="w-3 h-3" aria-hidden="true" />
          {verdictTag}
        </div>
      )}
      <div
        className={`text-label-xs mb-2 ${winner ? 'opacity-60' : 'text-ink-60'}`}
      >
        {label}
      </div>
      <div className="text-property-name mb-3 line-clamp-2">{property.name}</div>
      <div
        className={`text-price-lg ${winner ? 'text-paper' : 'text-ink'}`}
      >
        {property.price}
      </div>

      {/* Total score */}
      {hasScore && (
        <>
          <div
            className={[
              'font-display text-[64px] leading-none tracking-[-3px] mt-2 mb-0.5',
              winner ? 'text-paper' : 'text-ink-30',
            ].join(' ')}
            aria-label={`総合スコア ${totalScore}`}
          >
            {totalScore}
          </div>
          <div
            className={[
              'font-mono text-[9px] tracking-[0.1em] uppercase',
              winner ? 'text-paper/40' : 'text-ink-30',
            ].join(' ')}
          >
            / 100 総合スコア
          </div>
        </>
      )}

      {/* Axis score bars */}
      {hasAxes && (
        <div className="mt-2.5 flex flex-col gap-0.5">
          {(Object.keys(AXIS_LABELS) as Array<keyof WinnerBannerAxisScores>).map(
            (axis) => {
              const value = axisScores[axis];
              return (
                <div key={axis} className="flex items-center gap-2">
                  {/* Label */}
                  <span
                    className={[
                      'font-mono text-[9px] tracking-[0.06em] uppercase w-11 flex-shrink-0',
                      winner ? 'text-paper/40' : 'text-ink-30',
                    ].join(' ')}
                  >
                    {AXIS_LABELS[axis]}
                  </span>
                  {/* Bar track */}
                  <div
                    className={[
                      'flex-1 h-[3px] rounded-[2px]',
                      winner ? 'bg-white/15' : 'bg-paper-dark',
                    ].join(' ')}
                    role="presentation"
                  >
                    <div
                      className={[
                        'h-full rounded-[2px]',
                        winner ? 'bg-white' : 'bg-ink-30',
                      ].join(' ')}
                      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                    />
                  </div>
                  {/* Numeric value */}
                  <span
                    className={[
                      'font-mono text-[10px] font-medium w-6 text-right flex-shrink-0',
                      winner ? 'text-paper/80' : 'text-ink-30',
                    ].join(' ')}
                    aria-label={`${AXIS_LABELS[axis]} ${value}`}
                  >
                    {value}
                  </span>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Reason — winner side only */}
      {winner && reason && (
        <p className="text-[12px] leading-[1.65] mt-1.5 text-paper/65 max-w-[340px]">
          {reason}
        </p>
      )}
    </div>
  );
};
