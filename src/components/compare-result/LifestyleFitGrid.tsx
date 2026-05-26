import { useTranslation } from 'react-i18next';
import { ASPECT_ORDER } from '@/lib/lifestyleFitAspects';
import type { AspectKey, LifestyleFitAspect } from '@/lib/lifestyleFitAspects';

interface LifestyleFitGridProps {
  aspects: LifestyleFitAspect[];
  propertyAName: string;
  propertyBName: string;
}

const WIN_BADGE =
  'inline-flex items-center bg-ink text-paper font-mono text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-[2px] flex-shrink-0';
const DRAW_BADGE =
  'inline-flex items-center bg-paper-dark text-ink-60 font-mono text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-[2px] flex-shrink-0';

export const LifestyleFitGrid = ({
  aspects,
  propertyAName,
  propertyBName,
}: LifestyleFitGridProps) => {
  const { t } = useTranslation();

  // Build a lookup map from the API response, keyed by aspect
  const aspectMap = new Map<AspectKey, LifestyleFitAspect>();
  for (const item of aspects) {
    // Only accept known keys
    if ((ASPECT_ORDER as readonly string[]).includes(item.aspect)) {
      aspectMap.set(item.aspect as AspectKey, item);
    }
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule rounded-lg overflow-hidden"
      role="region"
      aria-label={t('comparisonDetail.lifestyleFit.title')}
    >
      {ASPECT_ORDER.map((key) => {
        const item = aspectMap.get(key);
        const labelKey = `comparisonDetail.lifestyleFit.aspects.${key}`;
        const label = t(labelKey);
        const valueA = item?.property_a || '—';
        const valueB = item?.property_b || '—';
        const winner = item?.winner;

        return (
          <div key={key} className="bg-paper p-5">
            {/* Aspect label eyebrow */}
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-60 mb-3">
              {label}
            </div>

            {/* Property A row */}
            <div className="flex items-start gap-1.5 mb-2">
              <span className="font-mono text-[10px] text-ink-30 shrink-0 leading-[1.6]">A ·</span>
              <span className="text-[13px] leading-snug">{valueA}</span>
              {winner === 'A' && (
                <span className={WIN_BADGE + ' ml-1 self-start mt-[2px]'} aria-label="Winner A">
                  WIN
                </span>
              )}
              {winner === 'draw' && (
                <span className={DRAW_BADGE + ' ml-1 self-start mt-[2px]'} aria-label="Draw">
                  DRAW
                </span>
              )}
            </div>

            {/* Property B row */}
            <div className="flex items-start gap-1.5">
              <span className="font-mono text-[10px] text-ink-30 shrink-0 leading-[1.6]">B ·</span>
              <span className="text-[13px] leading-snug">{valueB}</span>
              {winner === 'B' && (
                <span className={WIN_BADGE + ' ml-1 self-start mt-[2px]'} aria-label="Winner B">
                  WIN
                </span>
              )}
            </div>

            {/* Property name legend */}
            <div className="flex gap-3 mt-3 pt-3 border-t border-rule">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-ink shrink-0" />
                <span className="text-[10px] text-ink-60 truncate">{propertyAName}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-ink-30 shrink-0" />
                <span className="text-[10px] text-ink-60 truncate">{propertyBName}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
