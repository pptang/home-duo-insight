export interface ComparisonRow {
  key: string;
  label: string;
  valueA: string | null | undefined;
  valueB: string | null | undefined;
  mono?: boolean; // render values in DM Mono (e.g. prices, areas)
  highlight?: 'A' | 'B'; // subtle bg to signal which side "wins" this row
  winner?: 'A' | 'B' | 'draw'; // which cell gets the win/draw badge
  badgeLabel?: string; // text inside the badge pill (e.g. '安', '広', '割安')
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
  headerA?: string;
  headerB?: string;
}

const WIN_BADGE =
  'inline-flex items-center bg-ink text-paper font-mono text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-[2px] flex-shrink-0 ml-1.5';
const DRAW_BADGE =
  'inline-flex items-center bg-paper-dark text-ink-60 font-mono text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-[2px] flex-shrink-0 ml-1.5';

const WinBadge = ({ label }: { label: string }) => (
  <span className={WIN_BADGE} aria-label={`勝者: ${label}`}>
    <span className="sr-only">勝者: </span>
    {label}
  </span>
);

const DrawBadge = ({ label }: { label: string }) => (
  <span className={DRAW_BADGE} aria-label={`引き分け: ${label}`}>
    <span className="sr-only">引き分け: </span>
    {label}
  </span>
);

const renderValue = (v: string | null | undefined) =>
  v === null || v === undefined || v === '' ? (
    <span className="text-ink-30">—</span>
  ) : (
    v
  );

// Grid template kept as a literal class so Tailwind JIT can resolve it.
const GRID_COLS = 'grid grid-cols-[140px_1fr_1fr]';

export const ComparisonTable = ({
  rows,
  headerA,
  headerB,
}: ComparisonTableProps) => {
  const showHeader = Boolean(headerA || headerB);
  return (
    <div
      role="table"
      className="border border-rule rounded-lg overflow-hidden bg-white"
    >
      {showHeader && (
        <div
          role="row"
          className={`${GRID_COLS} bg-paper-dark border-b border-rule`}
        >
          <div className="px-4 py-2.5 text-label-xs text-ink-60" role="columnheader">
            項目
          </div>
          <div
            className="px-4 py-2.5 text-label-xs text-ink-60 border-l border-rule"
            role="columnheader"
          >
            {headerA}
          </div>
          <div
            className="px-4 py-2.5 text-label-xs text-ink-60 border-l border-rule"
            role="columnheader"
          >
            {headerB}
          </div>
        </div>
      )}
      {rows.map((row, i) => {
        const zebra = i % 2 === 1 ? 'bg-paper' : '';
        const valueClass = row.mono
          ? 'text-mono-value text-[13px]'
          : 'text-[13px] font-medium';
        const hasBadge = Boolean(row.winner && row.badgeLabel);
        return (
          <div
            role="row"
            key={row.key}
            className={`${GRID_COLS} border-b border-rule last:border-b-0 ${zebra}`}
          >
            <div
              role="rowheader"
              className="px-4 py-3 text-ink-60 text-label-sm"
            >
              {row.label}
            </div>
            <div
              role="cell"
              className={`px-4 py-3 border-l border-rule ${valueClass} ${
                row.highlight === 'A' ? 'bg-ink/[0.03]' : ''
              } flex items-baseline gap-0`}
            >
              {renderValue(row.valueA)}
              {hasBadge && (row.winner === 'A') && (
                <WinBadge label={row.badgeLabel!} />
              )}
              {hasBadge && row.winner === 'draw' && (
                <DrawBadge label={row.badgeLabel!} />
              )}
            </div>
            <div
              role="cell"
              className={`px-4 py-3 border-l border-rule ${valueClass} ${
                row.highlight === 'B' ? 'bg-ink/[0.03]' : ''
              } flex items-baseline gap-0`}
            >
              {renderValue(row.valueB)}
              {hasBadge && row.winner === 'B' && (
                <WinBadge label={row.badgeLabel!} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
