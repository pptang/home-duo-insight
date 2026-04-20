export interface ComparisonRow {
  key: string;
  label: string;
  valueA: string | null | undefined;
  valueB: string | null | undefined;
  mono?: boolean; // render values in DM Mono (e.g. prices, areas)
  highlight?: 'A' | 'B'; // subtle bg to signal which side "wins" this row
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
  headerA?: string;
  headerB?: string;
}

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
              }`}
            >
              {renderValue(row.valueA)}
            </div>
            <div
              role="cell"
              className={`px-4 py-3 border-l border-rule ${valueClass} ${
                row.highlight === 'B' ? 'bg-ink/[0.03]' : ''
              }`}
            >
              {renderValue(row.valueB)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
