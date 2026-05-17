import { Link } from "react-router-dom";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { Button } from "@/components/ui/button";

const STATUS_FILTERS = [
  { id: "all", label: "すべて" },
  { id: "expert", label: "専門家コメント済み" },
  { id: "pending", label: "コメント待ち" },
];

const AREA_FILTERS = [
  { id: "tokyo", label: "東京" },
  { id: "osaka", label: "大阪" },
  { id: "nagoya", label: "名古屋" },
  { id: "yokohama", label: "横浜" },
];

const PRICE_FILTERS = [
  { id: "p1", label: "〜3,000万" },
  { id: "p2", label: "3,000〜6,000万" },
  { id: "p3", label: "6,000〜1億" },
  { id: "p4", label: "1億〜" },
];

const FilterGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-60 pb-2 mb-2 border-b border-rule">
      {title}
    </div>
    <div className="flex flex-col gap-1">{children}</div>
  </div>
);

const FilterOption = ({
  label,
  active,
  onClick,
  radio = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  radio?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 text-left px-2 py-1.5 rounded text-[12px] transition-colors ${
      active ? "bg-ink text-paper" : "text-ink-60 hover:text-ink hover:bg-ink/[0.04]"
    }`}
  >
    <span
      className={`w-3.5 h-3.5 ${radio ? "rounded-full" : "rounded-sm"} border ${
        active ? "border-paper bg-paper" : "border-rule bg-transparent"
      } flex items-center justify-center`}
    >
      {active && (
        <span className={`block ${radio ? "w-1.5 h-1.5 rounded-full bg-ink" : "w-2 h-2 bg-ink"}`} />
      )}
    </span>
    {label}
  </button>
);

export interface FeedFiltersProps {
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  activeAreas: Set<string>;
  setActiveAreas: (s: Set<string>) => void;
  activePrices: Set<string>;
  setActivePrices: (s: Set<string>) => void;
}

const FeedFilters = ({
  statusFilter,
  setStatusFilter,
  activeAreas,
  setActiveAreas,
  activePrices,
  setActivePrices,
}: FeedFiltersProps) => {
  const toggleSet = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  return (
    <>
      <FilterGroup title="ステータス">
        {STATUS_FILTERS.map((s) => (
          <FilterOption
            key={s.id}
            label={s.label}
            active={statusFilter === s.id}
            onClick={() => setStatusFilter(s.id)}
            radio
          />
        ))}
      </FilterGroup>

      <FilterGroup title="エリア">
        {AREA_FILTERS.map((a) => (
          <FilterOption
            key={a.id}
            label={a.label}
            active={activeAreas.has(a.id)}
            onClick={() => toggleSet(activeAreas, a.id, setActiveAreas)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="価格帯">
        {PRICE_FILTERS.map((p) => (
          <FilterOption
            key={p.id}
            label={p.label}
            active={activePrices.has(p.id)}
            onClick={() => toggleSet(activePrices, p.id, setActivePrices)}
          />
        ))}
      </FilterGroup>

      <SurfaceCard tone="paper-dark" pad="sm" className="mt-8">
        <Eyebrow size="sm" className="mb-2">
          専門家の方へ
        </Eyebrow>
        <div className="font-display text-[16px] tracking-[-0.2px] mb-2 leading-[1.2]">
          レポートを認領
        </div>
        <p className="text-[12px] text-ink-60 leading-relaxed mb-3">
          あなたの専門知識でユーザーをサポート。
        </p>
        <Button asChild variant="editorial" size="editorial-sm">
          <Link to="/auth">専門家として登録</Link>
        </Button>
      </SurfaceCard>
    </>
  );
};

export default FeedFilters;
