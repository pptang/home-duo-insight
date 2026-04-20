import { Crown } from 'lucide-react';

export interface WinnerBannerProperty {
  name: string;
  price: string; // already formatted, e.g. "¥5,980万"
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

const Side = ({ label, property, winner, draw, verdictTag }: SideProps) => (
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
  </div>
);
