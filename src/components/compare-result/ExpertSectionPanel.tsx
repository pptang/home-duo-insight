import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ExpertProfileData {
  name: string | null;
  profile_image_url: string | null;
  user_id: string | null;
  profiles: {
    full_name: string | null;
    area_specialization: string | null;
  } | null;
}

interface VoteWithProfile {
  id: string;
  comparison_id: string;
  expert_user_id: string;
  voted_for: string;
  comment: string | null;
  created_at: string;
  expert_profiles: ExpertProfileData | null;
}

interface ExpertSectionPanelProps {
  comparisonId: string;
  propertyAName: string;
  propertyBName: string;
  propertyAAddress?: string | null;
  viewCount?: number | null;
  saveCount?: number | null;
}

function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('ja-JP');
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Derive a human-readable area label from a Japanese address:
// strip prefecture prefix (都/道/府/県), then extract the first 市/区 token
// (e.g. `東京都渋谷区神南` → `渋谷区エリア`, `静岡県静岡市駿河区…` → `静岡市エリア`).
// Falls back to the first 3 chars when no 市/区 is present.
function deriveAreaLabel(address: string | null | undefined): string {
  if (!address) return 'エリア未設定';
  const afterPrefecture = address.replace(/^.+?(都|道|府|県)/, '');
  const wardMatch = afterPrefecture.match(/^.+?(区|市)/);
  if (wardMatch) return `${wardMatch[0]}エリア`;
  return `${(afterPrefecture || address).slice(0, 3)}エリア`;
}

function formatJaDate(iso: string): string {
  return (
    new Date(iso).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) + ' コメント'
  );
}

// ── Unclaimed block ───────────────────────────────────────────────────────────

interface UnclaimedBlockProps {
  onClaim: () => void;
  areaLabel: string;
  viewCount?: number | null;
  saveCount?: number | null;
}

function UnclaimedBlock({ onClaim, areaLabel, viewCount, saveCount }: UnclaimedBlockProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-rule p-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-surface-2 shrink-0">
            🏠
          </div>
          {/* Text */}
          <div>
            <div className="text-label-sm text-ink-60 mb-0.5">不動産専門家の方へ</div>
            <div className="text-[15px] font-semibold text-ink mb-1">
              このレポートにあなたの見解を加えませんか？
            </div>
            <div className="text-[13px] text-ink-60 leading-relaxed">
              {areaLabel !== 'エリア未設定' && `${areaLabel}の`}専門家として、AI分析に現場の知見を追加できます。
              コメントにより潜在買主・借主と直接繋がる機会が生まれます。
            </div>
          </div>
        </div>
        {/* CTA */}
        <button
          onClick={onClaim}
          className="shrink-0 self-center px-4 py-2 rounded-lg bg-ink text-surface text-[13px] font-medium hover:opacity-80 transition-opacity"
        >
          このレポートを認領する →
        </button>
      </div>
      {/* Footer row */}
      <div className="mt-4 pt-4 border-t border-rule flex items-center gap-4 flex-wrap">
        <span className="text-[12px] text-ink-60">👁 {formatCount(viewCount)} 閲覧</span>
        <span className="text-[12px] text-ink-60">🔖 {formatCount(saveCount)} 人が保存</span>
        <span className="text-[12px] text-ink-60">📍 {areaLabel}</span>
        <span className="ml-auto font-mono text-[9px] text-ink-30">
          認領した専門家には閲覧者から直接問い合わせが届きます
        </span>
      </div>
    </div>
  );
}

// ── Claimed block ─────────────────────────────────────────────────────────────

interface ClaimedBlockProps {
  vote: VoteWithProfile;
  isAuthenticated: boolean;
  onContact: () => void;
}

function ClaimedBlock({ vote, isAuthenticated, onContact }: ClaimedBlockProps) {
  const expertName =
    vote.expert_profiles?.profiles?.full_name ||
    vote.expert_profiles?.name ||
    '専門家';
  const initials = getInitials(expertName);
  const areaSpecialization = vote.expert_profiles?.profiles?.area_specialization ?? '';
  const role = vote.expert_profiles?.name
    ? `${vote.expert_profiles.name}${areaSpecialization ? ' · ' + areaSpecialization : ''}`
    : areaSpecialization;
  const dateLabel = formatJaDate(vote.created_at);

  return (
    <div>
      {/* Expert profile */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-ink text-surface flex items-center justify-center text-[15px] font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-ink">{expertName}</div>
          {role && <div className="text-[12px] text-ink-60 mt-0.5">{role}</div>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-accent/10 text-accent">
              ✓ 認証済み専門家
            </span>
            {areaSpecialization && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-2 text-ink-60">
                {areaSpecialization} 専門
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto text-right shrink-0">
          <div className="text-[11px] text-ink-60">{dateLabel}</div>
          <div className="text-[11px] text-ink-60 mt-0.5">取引実績 –件</div>
        </div>
      </div>

      {/* Expert comment */}
      <div className="bg-surface-2 rounded-xl p-6 mb-6">
        <div className="text-label-sm text-ink-60 mb-3">専門家コメント</div>
        <div className="text-[19px] font-serif leading-relaxed text-ink mb-4">
          AI の判断を踏まえ、現場目線で補足します。
        </div>
        {vote.comment && (
          <div className="space-y-3 mt-4">
            <div
              className={`flex items-start gap-3 p-3 rounded-lg ${
                vote.voted_for === 'B'
                  ? 'bg-[#e8f0fe] border-l-4 border-[#4f80e1]'
                  : 'bg-[#fef3e8] border-l-4 border-[#e8a54f]'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current mt-1.5 shrink-0" />
              <span className="text-[13px] text-ink leading-relaxed">
                <strong>物件{vote.voted_for} について：</strong>
                {vote.comment}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Contact CTA */}
      <div className="flex items-center justify-between gap-6 p-5 rounded-xl border border-rule bg-surface-2">
        <div>
          <div className="text-[14px] font-semibold text-ink mb-0.5">
            {expertName}さんに直接相談する
          </div>
          <div className="text-[12px] text-ink-60">
            無料・ログインして問い合わせ。内覧調整・価格交渉サポートも対応。
          </div>
        </div>
        <div>
          <button
            onClick={onContact}
            className="px-4 py-2 rounded-lg bg-ink text-surface text-[13px] font-medium hover:opacity-80 transition-opacity"
          >
            {isAuthenticated ? '相談メッセージを送る →' : 'ログインして相談する →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export const ExpertSectionPanel = ({
  comparisonId,
  propertyAName: _propertyAName,
  propertyBName: _propertyBName,
  propertyAAddress,
  viewCount,
  saveCount,
}: ExpertSectionPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [votes, setVotes] = useState<VoteWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!comparisonId) return;

    const fetchVotes = async () => {
      setLoading(true);
      try {
        const { data: votesData, error } = await supabase
          .from('votes')
          .select('*')
          .eq('comparison_id', comparisonId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching expert votes:', error);
          return;
        }

        const votesWithProfiles: VoteWithProfile[] = await Promise.all(
          (votesData ?? []).map(async (vote) => {
            const { data: expertProfile } = await supabase
              .from('expert_profiles')
              .select('name, profile_image_url, user_id')
              .eq('user_id', vote.expert_user_id)
              .single();

            let profiles: ExpertProfileData['profiles'] = null;
            if (expertProfile?.user_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, area_specialization')
                .eq('id', expertProfile.user_id)
                .single();
              profiles = profileData ?? null;
            }

            return {
              ...vote,
              expert_profiles: expertProfile
                ? { ...expertProfile, profiles }
                : null,
            } as VoteWithProfile;
          }),
        );

        setVotes(votesWithProfiles);
      } catch (err) {
        console.error('Unexpected error fetching votes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVotes();
  }, [comparisonId]);

  if (!comparisonId) return null;

  const hasClaimed = votes.length > 0;
  const primaryVote = votes[0] ?? null;
  const areaLabel = deriveAreaLabel(propertyAAddress);

  return (
    <section className="max-w-[1040px] mx-auto px-6 mt-16 pt-12 border-t border-rule">
      <header className="mb-6">
        <div className="text-label-sm text-ink-60 mb-1">Expert Insight</div>
        <h2 className="text-section text-ink">不動産専門家の知見</h2>
        <p className="mt-2 text-[13px] text-ink-60 max-w-[620px]">
          AI 分析に加えて、地域を知る不動産専門家が現場の視点でコメントを追加できます。専門家のコメントが公開されると、閲覧者から直接問い合わせが届く場合があります。
        </p>
      </header>

      {loading ? (
        <div className="rounded-xl border border-rule p-6 text-[13px] text-ink-60">
          読み込み中…
        </div>
      ) : hasClaimed && primaryVote ? (
        <ClaimedBlock
          vote={primaryVote}
          isAuthenticated={!!user}
          onContact={() => navigate('/auth')}
        />
      ) : (
        <UnclaimedBlock
          onClaim={() => navigate('/auth')}
          areaLabel={areaLabel}
          viewCount={viewCount}
          saveCount={saveCount}
        />
      )}
    </section>
  );
};
