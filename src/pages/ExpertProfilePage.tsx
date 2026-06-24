import React, { useState, useEffect } from "react";
import { useParams, Link, useLoaderData, data, useRouteError, isRouteErrorResponse } from "react-router";
import type { LoaderFunctionArgs, MetaArgs, HeadersArgs } from "react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";
import { buildMeta } from "@/lib/seo";
import { truncate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ExpertProfileEditForm from "@/components/ExpertProfileEditForm";
import { ExpertRating } from "@/components/ExpertRating";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Globe, Instagram, Mail, Phone, Check, Star } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

interface ExpertActivity {
  totalVotes: number;
}

type ExpertProfileType = Database["public"]["Tables"]["expert_profiles"]["Row"];

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .substring(0, 2)
    .toUpperCase();

// --- SSR loader ---

export async function loader({ params }: LoaderFunctionArgs) {
  const expertId = params.expertId;
  if (!expertId) {
    throw data("Expert not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  // Profile fetch and vote count are independent — run them concurrently to
  // save a round-trip on every SSR render. The 404 check still gates on the
  // profile result after both resolve.
  const [
    { data: profile, error: profileError },
    { count },
  ] = await Promise.all([
    supabase.from("expert_profiles").select("*").eq("id", expertId).single(),
    supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("expert_user_id", expertId),
  ]);

  if (profileError || !profile) {
    throw data("Expert not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const seoTitle = truncate(
    `${profile.name} — Real Estate Expert in Japan | AiSumai (愛住)`,
    70,
  );
  const seoDescription = profile.bio
    ? truncate(profile.bio, 160)
    : `${profile.name} is a verified real estate expert on AiSumai. Get a second opinion on your home comparison.`;
  const seoUrl = `${SITE_URL}/experts/${expertId}`;

  return {
    expertProfile: profile,
    activity: { totalVotes: count ?? 0 },
    seo: { title: seoTitle, description: seoDescription, url: seoUrl },
  };
}

// --- per-expert meta ---

export function meta({ data: loaderData }: MetaArgs) {
  // Guard: meta runs even on 404 (loader throws); return fallback if no data.
  if (!loaderData) {
    return [{ title: "Expert not found | AiSumai (愛住)" }];
  }
  const { seo } = loaderData as Awaited<ReturnType<typeof loader>>;
  return buildMeta({ title: seo.title, description: seo.description, url: seo.url, ogType: "profile" });
}

// --- cache headers ---

export function headers({ errorHeaders, loaderHeaders }: HeadersArgs) {
  void loaderHeaders;
  if (errorHeaders?.has("Cache-Control")) return errorHeaders;
  return { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };
}

// --- ErrorBoundary (404 / unexpected errors) ---

export function ErrorBoundary() {
  const error = useRouteError();
  const { t } = useTranslation();

  const message = isRouteErrorResponse(error)
    ? error.data
    : (error as Error)?.message || "An unexpected error occurred";

  return (
    <div className="bg-paper text-ink min-h-screen">
      <div className="max-w-[1040px] mx-auto px-6 py-16 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-60 mb-3">
          404
        </p>
        <h1 className="font-display text-[28px] tracking-[-0.3px] mb-2">
          {typeof message === "string" && message !== "Expert not found"
            ? message
            : t("expertProfile.notFound")}
        </h1>
        <Link
          to="/experts"
          className="inline-block mt-4 text-[13px] text-ink underline underline-offset-4"
        >
          {"←"} 専門家一覧に戻る
        </Link>
      </div>
    </div>
  );
}

const ExpertProfilePage: React.FC = () => {
  const loaderData = useLoaderData<typeof loader>();
  const { expertId } = useParams<{ expertId: string }>();
  const { t } = useTranslation();
  // Seed local state from loader; reseed on navigation (loaderData identity changes
  // when React Router reuses the component instance across same-route navigations).
  const [expertProfile, setExpertProfile] = useState<ExpertProfileType>(
    () => loaderData.expertProfile,
  );
  const [activity, setActivity] = useState<ExpertActivity>(() => loaderData.activity);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // isOwnProfile is derived from useAuth() (NOT loader — loader has no session).
  const isOwnProfile = user && expertProfile ? user.id === expertProfile.id : false;

  // MANDATORY reseed — fixes /experts/A → /experts/B navigation.
  useEffect(() => {
    setExpertProfile(loaderData.expertProfile);
    setActivity(loaderData.activity);
  }, [loaderData]);

  const fetchExpertProfile = async () => {
    if (!expertId) return;
    try {
      const { data, error } = await supabase
        .from("expert_profiles")
        .select("*")
        .eq("id", expertId)
        .single();
      if (error) throw error;
      setExpertProfile(data);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  const handleEditToggle = () => setEditMode((v) => !v);
  const handleProfileUpdate = () => {
    setEditMode(false);
    fetchExpertProfile();
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expertProfile || !contactForm.name || !contactForm.email || !contactForm.message) {
      toast({
        variant: "destructive",
        title: t("expertProfile.errors.fillFields"),
        description: t("expertProfile.errors.fillFields"),
      });
      return;
    }

    setSendingEmail(true);
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: expertProfile.email,
          template: "contact-expert",
          templateData: {
            expertName: expertProfile.name,
            expertEmail: expertProfile.email,
            userName: contactForm.name,
            userEmail: contactForm.email,
            subject: contactForm.subject || "Message from AiSumai (愛住)",
            message: contactForm.message,
          },
        },
      });

      toast({
        title: t("expertProfile.toast.messageSent"),
        description: t("expertProfile.toast.messageSentDesc"),
      });

      setContactForm({ name: "", email: "", subject: "", message: "" });
      setShowContactModal(false);
    } catch (error) {
      console.error("Failed to send contact email:", error);
      toast({
        variant: "destructive",
        title: t("expertProfile.toast.sendFailed"),
        description: t("expertProfile.toast.sendFailed"),
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // No-id / not-found / loading guards removed: the loader throws 404 for missing
  // experts and React Router renders ErrorBoundary instead of this component.

  const initials = getInitials(expertProfile.name);
  const rating = expertProfile.average_rating ?? 0;
  const ratingCount = expertProfile.rating_count ?? 0;
  const tags = expertProfile.specialization_tags ?? [];

  return (
    <div className="bg-paper text-ink min-h-screen">
      <div className="max-w-[1040px] mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="pt-5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-60">
          <Link to="/" className="text-ink-60 hover:text-ink no-underline">
            Home
          </Link>
          <span className="opacity-30">/</span>
          <Link to="/experts" className="text-ink-60 hover:text-ink no-underline">
            専門家を探す
          </Link>
          <span className="opacity-30">/</span>
          <span>{expertProfile.name}</span>
        </nav>

        {editMode ? (
          <div className="my-8 bg-white border border-rule rounded-lg p-6">
            <div className="mb-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-60 mb-1">
                Edit Profile
              </div>
              <h2 className="font-display text-[24px] tracking-[-0.3px]">
                {t("expertProfile.editTitle")}
              </h2>
              <p className="text-[13px] text-ink-60 mt-1">
                {t("expertProfile.editDescription")}
              </p>
            </div>
            <ExpertProfileEditForm
              profile={expertProfile}
              onCancel={handleEditToggle}
              onUpdate={handleProfileUpdate}
            />
          </div>
        ) : (
          <>
            {/* PROFILE HERO */}
            <section className="pt-7 pb-8 border-b border-rule animate-in">
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-start">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-ink text-paper flex items-center justify-center font-display text-[32px] flex-shrink-0 ring-1 ring-rule shadow-[0_0_0_3px_white_inset] overflow-hidden">
                  {expertProfile.profile_image_url ? (
                    <img
                      src={expertProfile.profile_image_url}
                      alt={expertProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Identity */}
                <div className="min-w-0">
                  <h1 className="font-display text-[clamp(22px,3vw,32px)] leading-[1.1] tracking-[-0.5px] mb-1.5">
                    {expertProfile.name}
                  </h1>
                  {expertProfile.region && (
                    <div className="text-[14px] text-ink-60 mb-2.5">
                      {expertProfile.region}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.09em] px-2 py-0.5 rounded-sm bg-ink text-paper border border-ink">
                      <Check className="h-2.5 w-2.5" aria-hidden />
                      {t("expertProfile.expertBadge", "AiSumai 認証済み")}
                    </span>
                    {tags.slice(0, 8).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[8px] uppercase tracking-[0.09em] px-2 py-0.5 rounded-sm border border-rule text-ink-60 bg-paper-dark"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {expertProfile.bio && (
                    <p className="text-[13px] text-ink-60 leading-[1.75] max-w-[560px]">
                      {expertProfile.bio}
                    </p>
                  )}

                  {/* Social / web links */}
                  <div className="flex items-center gap-1 mt-3.5">
                    {expertProfile.company_website && (
                      <a
                        href={expertProfile.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded text-ink-30 hover:text-ink hover:bg-ink/[0.06] transition-colors"
                        title="Website"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {expertProfile.instagram_url && (
                      <a
                        href={expertProfile.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded text-ink-30 hover:text-ink hover:bg-ink/[0.06] transition-colors"
                        title="Instagram"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {expertProfile.x_handle && (
                      <a
                        href={`https://twitter.com/${expertProfile.x_handle.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded text-ink-30 hover:text-ink hover:bg-ink/[0.06] transition-colors"
                        title="X (Twitter)"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                    {expertProfile.email && (
                      <a
                        href={`mailto:${expertProfile.email}`}
                        className="w-8 h-8 flex items-center justify-center rounded text-ink-30 hover:text-ink hover:bg-ink/[0.06] transition-colors"
                        title="Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {expertProfile.phone && (
                      <a
                        href={`tel:${expertProfile.phone}`}
                        className="w-8 h-8 flex items-center justify-center rounded text-ink-30 hover:text-ink hover:bg-ink/[0.06] transition-colors"
                        title="Phone"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-px bg-rule border border-rule rounded-lg overflow-hidden min-w-[240px] self-start">
                  <div className="bg-white p-3.5 text-center">
                    <div className="font-display text-[28px] leading-none tracking-[-0.5px]">
                      {activity?.totalVotes ?? 0}
                    </div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink-60 mt-1">
                      {t("expertProfile.totalVotes", "投票数")}
                    </div>
                  </div>
                  <div className="bg-white p-3.5 text-center">
                    <div className="font-display text-[28px] leading-none tracking-[-0.5px]">
                      {ratingCount}
                    </div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink-60 mt-1">
                      レビュー
                    </div>
                  </div>
                  <div className="bg-white p-3.5 text-center">
                    <div className="font-display text-[28px] leading-none tracking-[-0.5px]">
                      {ratingCount > 0 ? rating.toFixed(1) : "—"}
                    </div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink-60 mt-1">
                      評価 / 5.0
                    </div>
                  </div>
                  <div className="col-span-3 bg-white px-3.5 py-2 border-t border-rule">
                    <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-60 flex items-center justify-center gap-1.5">
                      <span className="w-[7px] h-[7px] rounded-full bg-[#4a7c59]" />
                      通常 24時間以内に返信
                    </div>
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center gap-2 text-[13px] text-ink px-3.5 py-1.5 border border-rule rounded hover:bg-ink/[0.06] transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {t("expertProfile.editButton")}
                  </button>
                </div>
              )}
            </section>

            {/* PROFILE BODY */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 pt-7 pb-16 items-start animate-in">
              {/* LEFT */}
              <div>
                {/* About */}
                {expertProfile.bio && (
                  <section className="mb-7">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-60">
                        {t("expertProfile.aboutHeading", "プロフィール")}
                      </div>
                    </div>
                    <div className="bg-white border border-rule rounded-lg p-5">
                      <p className="text-[14px] leading-[1.75] text-ink whitespace-pre-line">
                        {expertProfile.bio}
                      </p>
                    </div>
                  </section>
                )}

                {/* Specialization */}
                {tags.length > 0 && (
                  <section className="mb-7">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-60">
                        {t("expertProfile.expertiseTitle", "専門分野")}
                      </div>
                    </div>
                    <div className="bg-white border border-rule rounded-lg p-5">
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[12px] px-2.5 py-1 rounded border border-rule text-ink"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Activity / Rating */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-60">
                      {t("expertProfile.activityTitle", "活動・レビュー")}
                    </div>
                    {ratingCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-60">
                        <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
                        {rating.toFixed(1)} / 5.0 · {ratingCount} レビュー
                      </span>
                    )}
                  </div>
                  <div className="bg-white border border-rule rounded-lg p-5">
                    <div className="grid grid-cols-2 gap-px bg-rule border border-rule rounded overflow-hidden mb-5">
                      <div className="bg-white p-4 text-center">
                        <div className="font-display text-[24px] leading-none">
                          {activity?.totalVotes ?? 0}
                        </div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink-60 mt-1">
                          {t("expertProfile.totalVotes", "投票数")}
                        </div>
                      </div>
                      <div className="bg-white p-4 text-center">
                        <div className="font-display text-[24px] leading-none">
                          {ratingCount > 0 ? rating.toFixed(1) : "—"}
                        </div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink-60 mt-1">
                          評価
                        </div>
                      </div>
                    </div>
                    {!isOwnProfile && (
                      <ExpertRating expertId={expertId} onRatingSubmitted={fetchExpertProfile} />
                    )}
                  </div>
                </section>
              </div>

              {/* RIGHT: Sticky contact card */}
              <aside>
                <div className="bg-white border border-rule rounded-lg overflow-hidden md:sticky md:top-[72px]">
                  <div className="px-5 py-4 border-b border-rule">
                    <div className="font-display text-[18px] tracking-[-0.3px] mb-0.5">
                      {expertProfile.name}さんに相談する
                    </div>
                    <div className="text-[12px] text-ink-60">
                      無料・通常24時間以内に返信
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <ul className="flex flex-col gap-2 mb-5">
                      {[
                        "内覧の調整・同行サポート",
                        "価格交渉・契約書の確認",
                        "ローン・税務のご紹介",
                        "比較レポートの追加質問",
                      ].map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-[12px] text-ink-60 leading-[1.55]"
                        >
                          <span className="w-1 h-1 rounded-full bg-ink-30 flex-shrink-0 mt-[7px]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => setShowContactModal(true)}
                      disabled={!expertProfile.email}
                      className="w-full py-3 bg-ink text-paper rounded-md text-[14px] font-medium hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mb-2"
                    >
                      {t("expertProfile.contactButton")} →
                    </button>

                    {expertProfile.phone && (
                      <a
                        href={`tel:${expertProfile.phone}`}
                        className="block text-center w-full py-2.5 bg-white border border-rule rounded-md text-[13px] text-ink hover:bg-ink/[0.06] transition-colors no-underline"
                      >
                        電話で問い合わせ
                      </a>
                    )}

                    <div className="h-px bg-rule my-4" />

                    <div className="flex items-center gap-1.5 text-[12px] text-ink-60">
                      <span className="w-[7px] h-[7px] rounded-full bg-[#4a7c59]" />
                      <span>現在オンライン · 今日対応可</span>
                    </div>

                    <div className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-30 text-center mt-3 leading-relaxed">
                      成約時のみ費用が発生します。
                      <br />
                      相談・問い合わせは完全無料です。
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

      {/* Contact Expert Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-md bg-white border-rule">
          <DialogHeader>
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-60 mb-1">
              Contact Expert
            </div>
            <DialogTitle className="font-display text-[22px] tracking-[-0.3px]">
              {t("expertProfile.contactTitle", { name: expertProfile?.name })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="contact-name"
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60 block mb-1.5"
              >
                {t("expertProfile.contactForm.yourName")}
              </label>
              <input
                id="contact-name"
                value={contactForm.name}
                onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 text-[16px] md:text-[14px] bg-paper border border-rule rounded-md text-ink outline-none focus:border-ink focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60 block mb-1.5"
              >
                {t("expertProfile.contactForm.yourEmail")}
              </label>
              <input
                id="contact-email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 text-[16px] md:text-[14px] bg-paper border border-rule rounded-md text-ink outline-none focus:border-ink focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="contact-subject"
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60 block mb-1.5"
              >
                {t("expertProfile.contactForm.subject")}
              </label>
              <input
                id="contact-subject"
                value={contactForm.subject}
                onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder={t("expertProfile.contactForm.subjectPlaceholder")}
                className="w-full px-3.5 py-2.5 text-[16px] md:text-[14px] bg-paper border border-rule rounded-md text-ink outline-none focus:border-ink focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="contact-message"
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60 block mb-1.5"
              >
                {t("expertProfile.contactForm.message")}
              </label>
              <textarea
                id="contact-message"
                value={contactForm.message}
                onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                placeholder={t("expertProfile.contactForm.messagePlaceholder")}
                rows={4}
                required
                className="w-full px-3.5 py-2.5 text-[16px] md:text-[14px] bg-paper border border-rule rounded-md text-ink outline-none focus:border-ink focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-colors resize-y"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="flex-1 py-2.5 bg-white border border-rule rounded-md text-[13px] text-ink hover:bg-ink/[0.06] transition-colors"
              >
                {t("expertProfile.contactForm.cancel")}
              </button>
              <button
                type="submit"
                disabled={sendingEmail}
                className="flex-1 py-2.5 bg-ink text-paper rounded-md text-[13px] font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {sendingEmail
                  ? t("expertProfile.contactForm.sending")
                  : t("expertProfile.contactForm.send")}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertProfilePage;
