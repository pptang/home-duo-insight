import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/**
 * StatusReportCard — shown on the /dashboard for comparisons that are still
 * processing or have failed. Published comparisons use the regular ReportCard.
 *
 * Visual language mirrors the Feed.tsx error block (border border-rule
 * rounded-lg, AlertTriangle icon, paper/ink/rule tokens).
 */
export interface StatusReportCardProps {
  comparisonId: string;
  /** Report number eyebrow, e.g. "#0001". */
  num: string;
  /** Relative date string, e.g. "2日前". */
  date: string;
  variant: "failed" | "processing";
  /** Persisted failure_reason value from the comparisons table. */
  failureReason?: string | null;
  /** Original URL for property A — needed to enable the retry button. */
  urlA?: string | null;
  /** Original URL for property B — needed to enable the retry button. */
  urlB?: string | null;
  onRetry: (id: string) => void;
  isRetrying: boolean;
}

const StatusReportCard = ({
  comparisonId,
  num,
  date,
  variant,
  failureReason,
  urlA,
  urlB,
  onRetry,
  isRetrying,
}: StatusReportCardProps) => {
  const { t } = useTranslation();
  const canRetry = !!(urlA && urlB);

  if (variant === "processing") {
    return (
      <div className="border border-rule rounded-lg p-4 bg-paper-dark">
        {/* Eyebrow */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-30">
            {num}
          </span>
          <span className="font-mono text-[9px] text-ink-30 ml-auto">{date}</span>
        </div>

        {/* Processing indicator */}
        <div className="flex items-center gap-2">
          {/* Pulsing dot */}
          <span className="w-2 h-2 rounded-full bg-ink-60 animate-pulse flex-shrink-0" />
          <span className="text-[13px] text-ink-60">
            {t("dashboard.processingLabel")}
          </span>
        </div>
      </div>
    );
  }

  // variant === "failed"
  const reasonKey = failureReason || "unknown";
  const reasonText = t(`dashboard.failureReasons.${reasonKey}`, {
    defaultValue: t("dashboard.failureReasons.unknown"),
  });

  return (
    <div className="border border-rule rounded-lg p-4 bg-paper-dark">
      {/* Eyebrow */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-30">
          {num}
        </span>
        <span className="font-mono text-[9px] text-ink-30 ml-auto">{date}</span>
      </div>

      {/* Error heading */}
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-ink-60 flex-shrink-0 mt-0.5" />
        <span className="text-[14px] font-display leading-[1.3] tracking-[-0.2px]">
          {t("dashboard.failedCard.title")}
        </span>
      </div>

      {/* Human-readable reason */}
      <p className="text-[12px] text-ink-60 leading-relaxed mb-4 pl-6">
        {reasonText}
      </p>

      {/* Retry area */}
      <div className="pl-6">
        {canRetry ? (
          <Button
            variant="editorial"
            size="editorial-sm"
            onClick={() => onRetry(comparisonId)}
            disabled={isRetrying}
          >
            {isRetrying
              ? t("dashboard.failedCard.retrying")
              : t("dashboard.failedCard.retry")}
          </Button>
        ) : (
          <span className="text-[11px] text-ink-30 font-mono">
            {t("dashboard.failedCard.cannotRetry")}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatusReportCard;
