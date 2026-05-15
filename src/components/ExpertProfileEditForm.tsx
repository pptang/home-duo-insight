import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";

type ExpertProfile = Database["public"]["Tables"]["expert_profiles"]["Row"];

interface ExpertProfileEditFormProps {
  profile: ExpertProfile;
  onCancel: () => void;
  onUpdate: () => void;
}

type ExpertProfileFormValues = {
  name: string;
  email: string;
  phone: string;
  bio: string;
  company_website: string;
  x_handle: string;
  instagram_url: string;
  line_url: string;
};

const ExpertProfileEditForm = ({
  profile,
  onCancel,
  onUpdate,
}: ExpertProfileEditFormProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile.profile_image_url
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ExpertProfileFormValues>({
    defaultValues: {
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      bio: profile.bio || "",
      company_website: profile.company_website || "",
      x_handle: profile.x_handle || "",
      instagram_url: profile.instagram_url || "",
      line_url: profile.line_url || "",
    }
  });

  // Load existing data into form
  useEffect(() => {
    setValue("name", profile.name || "");
    setValue("email", profile.email || "");
    setValue("phone", profile.phone || "");
    setValue("bio", profile.bio || "");
    setValue("company_website", profile.company_website || "");
    setValue("x_handle", profile.x_handle || "");
    setValue("instagram_url", profile.instagram_url || "");
    setValue("line_url", profile.line_url || "");
  }, [profile, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t("expertRating.error"),
          description: t("expertProfileEditForm.imageTooLarge"),
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: t("expertRating.error"),
          description: t("expertProfileEditForm.invalidImageType"),
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ExpertProfileFormValues) => {
    console.log("Submitted data:", data); // Debug log
    setIsLoading(true);

    try {
      let profile_image_url = profile.profile_image_url;

      // Upload image if changed
      if (imageFile) {
        const timestamp = new Date().getTime();
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `experts/${profile.id}/${timestamp}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("expert-profiles")
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("expert-profiles")
          .getPublicUrl(filePath);
        
        profile_image_url = urlData.publicUrl;
      }

      // Update profile data using react-hook-form data
      const { error } = await supabase
        .from("expert_profiles")
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          company_website: data.company_website,
          x_handle: data.x_handle,
          instagram_url: data.instagram_url,
          line_url: data.line_url,
          profile_image_url,
        })
        .eq("id", profile.id);

      if (error) {
        throw error;
      }

      toast({
        title: t("expertProfileEditForm.profileUpdated"),
        description: t("expertProfileEditForm.profileUpdatedDesc"),
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: t("expertProfileEditForm.errorUpdating"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Profile Image */}
        <div className="space-y-2">
          <Label htmlFor="profileImage">{t("expertProfileEditForm.profileImage")}</Label>
          <div className="flex items-center gap-4">
            {previewUrl && (
              <div className="relative w-24 h-24 rounded-full overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <Input
                id="profileImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("expertProfileEditForm.maxSize")}
              </p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">{t("expertProfileEditForm.name")}*</Label>
          <Input
            id="name"
            {...register("name", { required: t("expertProfileEditForm.nameRequired") })}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("expertProfileEditForm.email")}*</Label>
          <Input
            id="email"
            type="email"
            {...register("email", { 
              required: t("expertProfileEditForm.emailRequired"),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t("expertProfileEditForm.emailInvalid")
              }
            })}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">{t("expertProfileEditForm.phone")}</Label>
          <Input
            id="phone"
            {...register("phone")}
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">{t("expertProfileEditForm.bio")}</Label>
          <Textarea
            id="bio"
            {...register("bio")}
            placeholder={t("expertProfileEditForm.bioPlaceholder")}
            rows={4}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="company_website">{t("expertProfileEditForm.website")}</Label>
          <Input
            id="company_website"
            {...register("company_website")}
            placeholder={t("expertProfileEditForm.websitePlaceholder")}
          />
        </div>

        {/* Social Media */}
        <div className="space-y-2">
          <Label htmlFor="x_handle">{t("expertProfileEditForm.xHandle")}</Label>
          <Input
            id="x_handle"
            {...register("x_handle")}
            placeholder={t("expertProfileEditForm.xHandlePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram_url">{t("expertProfileEditForm.instagramUrl")}</Label>
          <Input
            id="instagram_url"
            {...register("instagram_url")}
            placeholder={t("expertProfileEditForm.instagramPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="line_url">{t("expertProfileEditForm.lineUrl")}</Label>
          <Input
            id="line_url"
            {...register("line_url")}
            placeholder={t("expertProfileEditForm.linePlaceholder")}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("expertProfileEditForm.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("expertProfileEditForm.saveChanges")}
        </Button>
      </div>
    </form>
  );
};

export default ExpertProfileEditForm;
