import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage("en")}>
          <span className="mr-2 text-xs font-semibold text-muted-foreground">EN</span>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("ja")}>
          <span className="mr-2 text-xs font-semibold text-muted-foreground">JA</span>
          日本語
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("zh-TW")}>
          <span className="mr-2 text-xs font-semibold text-muted-foreground">TW</span>
          繁體中文
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
