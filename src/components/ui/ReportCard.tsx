import { Link } from "react-router-dom";
import { Eye } from "lucide-react";

/**
 * Shared "report card" used by the Landing DISCOVER section and the Feed page.
 *
 * Both call sites previously kept their own near-identical inline cards. This
 * component is the single source of truth for the layout: number+area+date
 * eyebrow, A/B property column with prices, comparison highlight pills, AI
 * score boxes with the "AI 推奨" badge, the expert row (claimed / unclaimed),
 * and the optional view/save meta footer.
 *
 * Empty-state rules (see bead home-duo-insight-ve7):
 *  - `expert` null/undefined  -> render the unclaimed "専門家コメント待ち" row
 *  - `meta` with 0 saves      -> hide the meta footer entirely
 *  - score tie (scoreA===scoreB) -> neither side wins, no "AI 推奨" badge
 *
 * Tailwind classes only — no separate CSS file.
 */

export interface ReportCardProperty {
  /** Display name of the property. */
  name: string;
  /** Pre-formatted price string, e.g. "¥8,500万". */
  price: string;
  /** AI comparison score, 0–100. */
  score: number;
}

export interface ReportCardHighlight {
  /** Leading plain text, e.g. "B が". */
  text: string;
  /** Emphasised fragment rendered bold, e.g. "700万円高い". */
  strong: string;
}

export interface ReportCardExpert {
  /** Expert display name. */
  name: string;
  /** Single-character avatar initial. Defaults to the first char of `name`. */
  initial?: string;
}

export interface ReportCardMeta {
  /** View count. */
  views: number;
  /** Save / bookmark count. The meta footer is hidden entirely when this is 0. */
  saves: number;
}

export interface ReportCardProps {
  /** Route the whole card links to. */
  to: string;
  /** Report number eyebrow, e.g. "#0142". */
  num: string;
  /** Area / location eyebrow, e.g. "渋谷区 · 目黒区". */
  area: string;
  /** Relative date string, e.g. "2 日前". */
  date: string;
  propertyA: ReportCardProperty;
  propertyB: ReportCardProperty;
  /** Comparison highlight pills. */
  highlights: ReportCardHighlight[];
  /** Expert who claimed the report, or null/undefined when unclaimed. */
  expert?: ReportCardExpert | null;
  /** Optional view/save counts. Footer hidden when omitted or saves === 0. */
  meta?: ReportCardMeta | null;
  /** Optional fade-in animation style applied to the card root. */
  style?: React.CSSProperties;
}

const ReportCard = ({
  to,
  num,
  area,
  date,
  propertyA,
  propertyB,
  highlights,
  expert,
  meta,
  style,
}: ReportCardProps) => {
  // Winner is derived from the score comparison. A tie means neither side wins,
  // so the "AI 推奨" badge is suppressed on both columns.
  const aWins = propertyA.score > propertyB.score;
  const bWins = propertyB.score > propertyA.score;

  // Meta footer (view / save counts) is shown only when meta is provided and
  // there is at least one save — a 0-save report hides the footer entirely.
  const showMeta = !!meta && meta.saves > 0;

  return (
    <Link to={to} className="rcard no-underline text-ink" style={style}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] min-h-[120px]">
        <div className="p-4 flex flex-col justify-between border-r border-rule">
          <div>
            {/* Eyebrow: number + area + relative date */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-30">
                {num}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-60 bg-paper-dark px-1.5 py-0.5 rounded-sm">
                {area}
              </span>
              <span className="font-mono text-[9px] text-ink-30 ml-auto">{date}</span>
            </div>

            {/* A vs B with prices */}
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-display text-[13px] leading-[1.25] tracking-[-0.2px] truncate">
                  {propertyA.name}
                </div>
                <div className="font-display text-[14px] tracking-[-0.3px] mt-0.5">
                  {propertyA.price}
                </div>
              </div>
              <div className="flex-shrink-0 w-[22px] h-[22px] border border-rule rounded-full flex items-center justify-center font-mono text-[8px] text-ink-30 mt-0.5">
                vs
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[13px] leading-[1.25] tracking-[-0.2px] truncate">
                  {propertyB.name}
                </div>
                <div className="font-display text-[14px] tracking-[-0.3px] mt-0.5">
                  {propertyB.price}
                </div>
              </div>
            </div>
          </div>

          {/* Comparison highlight pills */}
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {highlights.map((h, i) => (
                <span
                  key={i}
                  className="text-[11px] text-ink-60 bg-paper-dark px-1.5 py-0.5 rounded-sm"
                >
                  {h.text}
                  <strong className="text-ink font-medium">{h.strong}</strong>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="grid grid-cols-2 flex-1">
            <ScoreBox label="物件 A" score={propertyA.score} win={aWins} />
            <ScoreBox label="物件 B" score={propertyB.score} win={bWins} />
          </div>

          {/* Expert row: claimed vs unclaimed */}
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            {expert ? (
              <>
                <div className="w-5 h-5 rounded-full bg-ink text-paper flex items-center justify-center font-mono text-[8px]">
                  {expert.initial ?? expert.name.charAt(0)}
                </div>
                <span className="text-[11px] font-medium flex-1 truncate">
                  {expert.name}
                </span>
                <span className="font-mono text-[7px] uppercase tracking-[0.08em] border border-rule text-ink-60 px-1.5 py-0.5 rounded-sm">
                  コメントあり
                </span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-paper-dark border border-rule text-ink-30 flex items-center justify-center font-mono text-[8px]">
                  ?
                </div>
                <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-30 flex-1">
                  専門家コメント待ち
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Meta footer — view / save counts. Hidden entirely when saves === 0.
          The save count uses the explicit "N 人が保存" label (matching
          ExpertSectionPanel). The emoji prefix was dropped because the
          bookmark glyph (🔖) renders as a notdef "!" box on devices whose
          UI font lacks it — the root cause of the reported "! 票" artifact. */}
      {showMeta && (
        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-paper-dark border-t border-rule">
          <span className="flex items-center gap-1 font-mono text-[9px] uppercase text-ink-30">
            <Eye className="h-2.5 w-2.5" aria-hidden="true" />
            {meta!.views}
          </span>
          <span className="font-mono text-[9px] uppercase text-ink-30">
            {meta!.saves} 人が保存
          </span>
        </div>
      )}
    </Link>
  );
};

const ScoreBox = ({
  label,
  score,
  win,
}: {
  label: string;
  score: number;
  win: boolean;
}) => (
  <div
    className={`p-2.5 flex flex-col justify-between border-b border-rule ${
      win ? "bg-ink" : "bg-paper-dark"
    }`}
  >
    <div
      className={`font-mono text-[8px] uppercase tracking-[0.1em] mb-0.5 ${
        win ? "text-paper/40" : "text-ink-30"
      }`}
    >
      {label}
    </div>
    <div
      className={`font-display text-[26px] leading-none tracking-[-1px] ${
        win ? "text-paper" : "text-ink-30"
      }`}
    >
      {score}
    </div>
    <div className={`font-mono text-[8px] ${win ? "text-paper/30" : "text-ink-30"}`}>
      / 100
    </div>
    {win && (
      <span className="font-mono text-[7px] uppercase tracking-[0.1em] border border-paper/25 text-paper/70 px-1.5 py-0.5 rounded-sm w-fit mt-1">
        AI 推奨
      </span>
    )}
  </div>
);

export default ReportCard;
