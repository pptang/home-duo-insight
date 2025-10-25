import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          data: {
            full_name: fullName,
          },
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
    } catch (error) {
      console.error("Error signing up:", error);
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
    } catch (error) {
      console.error("Error signing in:", error);
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
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow bg-[#F7F7F8] py-12">
        <div className="container max-w-md mx-auto px-4">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth.tabs.signin")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.tabs.signup")}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>{t("auth.signin.title")}</CardTitle>
                  <CardDescription>
                    {t("auth.signin.description")}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">{t("auth.fields.email")}</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder={t("auth.fields.email_placeholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">{t("auth.fields.password")}</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder={t("auth.fields.password_placeholder")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full bg-[#6A7FDB] hover:bg-[#5A6DCB]"
                      disabled={loading}
                    >
                      {loading ? t("auth.signin.loading") : t("auth.signin.button")}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>{t("auth.signup.title")}</CardTitle>
                  <CardDescription>
                    {t("auth.signup.description")}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t("auth.fields.fullName")}</Label>
                      <Input
                        id="signup-name"
                        placeholder={t("auth.fields.name_placeholder")}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t("auth.fields.email")}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t("auth.fields.email_placeholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t("auth.fields.password")}</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder={t("auth.fields.password_placeholder")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full bg-[#6A7FDB] hover:bg-[#5A6DCB]"
                      disabled={loading}
                    >
                      {loading ? t("auth.signup.loading") : t("auth.signup.button")}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
