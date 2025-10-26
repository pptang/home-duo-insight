
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AuthButtons() {
  const { t } = useTranslation();
  const { user, profile, isLoading, isExpert, isAdmin, signOut } = useAuth();

  if (isLoading) {
    return <Button variant="ghost" size="sm" disabled>{t("authButtons.loading")}</Button>;
  }

  if (!user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/auth">{t("authButtons.signIn")}</Link>
      </Button>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-2">
      {isExpert && (
        <Badge variant="outline" className="bg-primary text-white border-0">
          {t("authButtons.expertBadge")}
        </Badge>
      )}
      {isAdmin && (
        <Badge variant="outline" className="bg-black text-white border-0">
          {t("authButtons.adminBadge")}
        </Badge>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full p-0 w-9 h-9">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("authButtons.myAccount")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{profile?.full_name || user.email}</span>
          </DropdownMenuItem>
          
          {isExpert && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="flex items-center gap-2">
                <Link to={`/experts/${user.id}`}>
                  <UserRound className="h-4 w-4" />
                  <span>{t("authButtons.myProfile")}</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600 flex items-center gap-2"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            <span>{t("authButtons.signOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
