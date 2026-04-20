import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

type Mode = "signin" | "signup";

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast({
          variant: "destructive",
          title: t("auth.toast.signup_failed"),
          description: error.message,
        });
      } else {
        toast({
          title: t("auth.toast.signup_success"),
          description: t("auth.toast.signup_success_desc"),
        });
        navigate("/");
      }
    } catch {
      toast({
        variant: "destructive",
        title: t("auth.toast.signup_failed"),
        description: t("auth.toast.unexpected_error"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          variant: "destructive",
          title: t("auth.toast.signin_failed"),
          description: error.message,
        });
      } else {
        toast({
          title: t("auth.toast.signin_success"),
          description: t("auth.toast.signin_success_desc"),
        });
        navigate("/");
      }
    } catch {
      toast({
        variant: "destructive",
        title: t("auth.toast.signin_failed"),
        description: t("auth.toast.unexpected_error"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Top bar */}
      <nav className="fixed top-0 left-0 right-0 h-[52px] bg-paper/95 backdrop-blur-md border-b border-rule z-50 flex items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-1.5 no-underline text-ink">
          <span className="font-display text-[18px] tracking-[-0.3px]">愛住 AiSumai</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-60 border border-rule rounded px-1.5 py-[2px]">
            Beta
          </span>
        </Link>
        <Link
          to="/"
          className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-60 hover:text-ink no-underline flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3 h-3" />
          ホームに戻る
        </Link>
      </nav>

      {/* Split layout */}
      <div className="grid md:grid-cols-2 min-h-screen pt-[52px]">
        {/* Brand panel */}
        <div className="hidden md:flex bg-ink text-paper relative overflow-hidden flex-col justify-between p-12">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.08] bg-paper"
          />
          <div
            className="absolute -bottom-40 -left-32 w-[480px] h-[480px] rounded-full opacity-[0.05] bg-paper"
          />

          <div className="relative z-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] opacity-50 mb-6">
              JOIN AISUMAI
            </div>
            <h1 className="font-display text-[44px] leading-[1.05] tracking-[-0.5px] mb-4">
              Compare homes,
              <br />
              <em className="italic opacity-70">not brochures.</em>
            </h1>
            <p className="text-[14px] opacity-70 leading-relaxed max-w-md">
              2つの物件を入力するだけ。AIと専門家のダブルチェックでフェアな判断を。
            </p>

            <div className="mt-12 grid gap-4 max-w-md">
              {[
                { num: "01", title: "AI 比較レポート", body: "数秒で2物件の総合スコアを算出。" },
                { num: "02", title: "専門家コメント", body: "認証済みプロが補足・推奨を投稿。" },
                { num: "03", title: "保存・共有", body: "比較結果は固定 URL でいつでも参照。" },
              ].map((f) => (
                <div key={f.num} className="flex items-start gap-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.1em] opacity-50 w-7 mt-0.5">
                    {f.num}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium mb-1">{f.title}</div>
                    <div className="text-[12px] opacity-60 leading-relaxed">{f.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 font-mono text-[9px] uppercase tracking-[0.1em] opacity-40">
            AiSumai · Phase 1 · 2026
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-[400px]">
            {/* Mode toggle */}
            <div className="flex gap-1 mb-8 border-b border-rule">
              {([
                { id: "signin" as Mode, label: t("auth.tabs.signin") },
                { id: "signup" as Mode, label: t("auth.tabs.signup") },
              ]).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors ${
                    mode === m.id
                      ? "border-ink text-ink"
                      : "border-transparent text-ink-60 hover:text-ink"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <h2 className="font-display text-[28px] tracking-[-0.3px] mb-2">
              {mode === "signin" ? t("auth.signin.title") : t("auth.signup.title")}
            </h2>
            <p className="text-[13px] text-ink-60 mb-8 leading-relaxed">
              {mode === "signin" ? t("auth.signin.description") : t("auth.signup.description")}
            </p>

            <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-5">
              {mode === "signup" && (
                <div>
                  <label htmlFor="signup-name" className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60 block mb-1.5">
                    {t("auth.fields.fullName")}
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    placeholder={t("auth.fields.name_placeholder")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-rule rounded-md text-ink outline-none transition-colors focus:border-ink focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]"
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60 block mb-1.5">
                  {t("auth.fields.email")}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder={t("auth.fields.email_placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-rule rounded-md text-ink outline-none transition-colors focus:border-ink focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]"
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60 block mb-1.5">
                  {t("auth.fields.password")}
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.fields.password_placeholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 pr-10 text-[14px] bg-white border border-rule rounded-md text-ink outline-none transition-colors focus:border-ink focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-60 hover:text-ink p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink text-paper py-3 rounded-md text-[13px] font-medium hover:opacity-85 transition-opacity disabled:opacity-50"
              >
                {loading
                  ? mode === "signin"
                    ? t("auth.signin.loading")
                    : t("auth.signup.loading")
                  : mode === "signin"
                  ? t("auth.signin.button")
                  : t("auth.signup.button")}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex-1 h-px bg-rule" />
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-30">or</span>
              <div className="flex-1 h-px bg-rule" />
            </div>

            <button
              type="button"
              onClick={() => {
                supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/` },
                });
              }}
              className="mt-6 w-full bg-white border border-rule py-3 rounded-md text-[13px] font-medium text-ink hover:bg-paper-dark transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M15.68 8.18c0-.55-.05-1.07-.14-1.58H8v3h4.31c-.19 1-.76 1.85-1.62 2.42v2.01h2.62c1.53-1.41 2.41-3.49 2.41-5.85z" fill="#4285F4" />
                <path d="M8 16c2.18 0 4-.72 5.34-1.96l-2.62-2.01c-.72.48-1.65.77-2.72.77-2.1 0-3.87-1.41-4.51-3.31H.78v2.07A8 8 0 0 0 8 16z" fill="#34A853" />
                <path d="M3.49 9.49c-.16-.48-.25-1-.25-1.49s.09-1.01.25-1.49V4.44H.78A8 8 0 0 0 0 8c0 1.29.31 2.51.78 3.56l2.71-2.07z" fill="#FBBC05" />
                <path d="M8 3.18c1.18 0 2.24.41 3.08 1.21l2.31-2.31C12 .82 10.18 0 8 0 4.85 0 2.13 1.81.78 4.44l2.71 2.07c.65-1.91 2.41-3.32 4.51-3.32z" fill="#EA4335" />
              </svg>
              Google で続ける
            </button>

            <p className="mt-8 text-center text-[12px] text-ink-60">
              続行することで{" "}
              <Link to="/terms" className="text-ink underline">利用規約</Link> と{" "}
              <Link to="/privacy" className="text-ink underline">プライバシーポリシー</Link> に同意したことになります。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
