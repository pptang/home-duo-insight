import { ExpertSection } from '@/components/ExpertSection';

interface ExpertSectionPanelProps {
  comparisonId: string;
  propertyAName: string;
  propertyBName: string;
}

export const ExpertSectionPanel = ({
  comparisonId,
  propertyAName,
  propertyBName,
}: ExpertSectionPanelProps) => (
  <section className="max-w-[1040px] mx-auto px-6 mt-16 pt-12 border-t border-rule">
    <header className="mb-6">
      <div className="text-label-sm text-ink-60 mb-1">Expert Insight</div>
      <h2 className="text-section text-ink">不動産専門家の知見</h2>
      <p className="mt-2 text-[13px] text-ink-60 max-w-[620px]">
        AI 分析に加えて、地域を知る不動産専門家が現場の視点でコメントを追加できます。専門家のコメントが公開されると、閲覧者から直接問い合わせが届く場合があります。
      </p>
    </header>
    <ExpertSection
      comparisonId={comparisonId}
      propertyAName={propertyAName}
      propertyBName={propertyBName}
    />
  </section>
);
