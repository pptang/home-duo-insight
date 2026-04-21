export interface AxisScores {
  price: number;    // 0–100
  location: number; // 0–100
  building: number; // 0–100
}

export interface ScoreCardsGridProps {
  scoresA: AxisScores;
  scoresB: AxisScores;
  propertyAName?: string;
  propertyBName?: string;
}

interface CardProps {
  label: string;
  scoreA: number;
  scoreB: number;
  nameA: string;
  nameB: string;
}

const DRAW_THRESHOLD = 5;

function winnerLabel(scoreA: number, scoreB: number): { text: string; side: 'A' | 'B' | 'draw' } {
  const delta = scoreA - scoreB;
  if (Math.abs(delta) <= DRAW_THRESHOLD) return { text: '同等', side: 'draw' };
  return delta > 0
    ? { text: 'A 優位', side: 'A' }
    : { text: 'B 優位', side: 'B' };
}

const ScoreCard = ({ label, scoreA, scoreB, nameA, nameB }: CardProps) => {
  const { text, side } = winnerLabel(scoreA, scoreB);

  return (
    <div className="bg-paper p-5">
      {/* Axis label */}
      <div className="font-mono text-[9px] tracking-widest uppercase text-ink-60 mb-3">
        {label}
      </div>

      {/* Score bars */}
      <div className="flex flex-col gap-2">
        {/* A bar */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] text-ink-60 flex justify-between">
            <span>{nameA}</span>
            <span>{scoreA}</span>
          </div>
          <div className="h-[5px] bg-paper-dark rounded-full overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 h-full bg-ink rounded-full"
              style={{ width: `${scoreA}%` }}
            />
          </div>
        </div>

        {/* B bar */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] text-ink-60 flex justify-between">
            <span>{nameB}</span>
            <span>{scoreB}</span>
          </div>
          <div className="h-[5px] bg-paper-dark rounded-full overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 h-full bg-ink-30 rounded-full"
              style={{ width: `${scoreB}%` }}
            />
          </div>
        </div>
      </div>

      {/* Legend + winner */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-ink" />
            <span className="text-[10px] text-ink-60">{nameA}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-ink-30" />
            <span className="text-[10px] text-ink-60">{nameB}</span>
          </div>
        </div>

        <span
          className={
            side === 'draw'
              ? 'font-mono text-[9px] px-1.5 py-0.5 rounded border border-ink-10 text-ink-60'
              : 'font-mono text-[9px] px-1.5 py-0.5 rounded bg-ink text-paper'
          }
        >
          {text}
        </span>
      </div>
    </div>
  );
};

const CARDS: Array<{ key: keyof AxisScores; label: string }> = [
  { key: 'price',    label: '価格・コスト' },
  { key: 'location', label: '立地・交通' },
  { key: 'building', label: '建物・設備' },
];

export const ScoreCardsGrid = ({
  scoresA,
  scoresB,
  propertyAName = '物件 A',
  propertyBName = '物件 B',
}: ScoreCardsGridProps) => (
  <div
    className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink-10 border border-ink-10 rounded-lg overflow-hidden mb-7"
    role="region"
    aria-label="軸別スコア比較"
  >
    {CARDS.map(({ key, label }) => (
      <ScoreCard
        key={key}
        label={label}
        scoreA={scoresA[key]}
        scoreB={scoresB[key]}
        nameA={propertyAName}
        nameB={propertyBName}
      />
    ))}
  </div>
);
