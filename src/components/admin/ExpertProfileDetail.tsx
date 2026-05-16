import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ExpertProfileDetailProps {
  expertId: string;
  onUpdate?: () => void;
}

interface ExpertProfile {
  id: string;
  name: string;
  email: string;
  profile_image_url: string | null;
  phone: string | null;
  company_website: string | null;
  x_handle: string | null;
  instagram_url: string | null;
  line_url: string | null;
  average_rating: number;
  rating_count: number;
}

const expertFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().optional().nullable(),
  company_website: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .nullable()
    .or(z.literal("")),
  x_handle: z.string().optional().nullable(),
  instagram_url: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .nullable()
    .or(z.literal("")),
  line_url: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .nullable()
    .or(z.literal("")),
});

type ExpertFormValues = z.infer<typeof expertFormSchema>;

export function ExpertProfileDetail({
  expertId,
  onUpdate,
}: ExpertProfileDetailProps) {
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const { toast } = useToast();

  const form = useForm<ExpertFormValues>({
    resolver: zodResolver(expertFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      company_website: "",
      x_handle: "",
      instagram_url: "",
      line_url: "",
    },
  });

  // Fetch expert profile
  const fetchExpertProfile = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("expert_profiles")
        .select("*")
        .eq("user_id", expertId)
        .single();

      if (error) {
        console.error("Error fetching expert profile:", error);
        toast({
          title: "Error",
          description: "Failed to load expert profile",
          variant: "destructive",
        });
        return;
      }

      setExpert(data as ExpertProfile);

      // Set form values
      form.reset({
        name: data.name,
        phone: data.phone || "",
        company_website: data.company_website || "",
        x_handle: data.x_handle || "",
        instagram_url: data.instagram_url || "",
        line_url: data.line_url || "",
      });

      // Set profile image preview if available
      if (data.profile_image_url) {
        setProfileImagePreview(data.profile_image_url);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load expert profile on component mount
  useEffect(() => {
    fetchExpertProfile();
  }, [expertId]);

  // Handle profile image change
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file (PNG, JPG, or WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setProfileImageFile(file);

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save expert profile
  const onSubmit = async (data: ExpertFormValues) => {
    if (!expert) return;

    setIsSaving(true);

    try {
      // 1. Upload profile image if changed
      let profileImageUrl = expert.profile_image_url;

      if (profileImageFile) {
        const fileExt = profileImageFile.name.split(".").pop();
        const fileName = `experts/${expert.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("expert-profiles")
          .upload(fileName, profileImageFile);

        if (uploadError) {
          console.error("Error uploading profile image:", uploadError);
          toast({
            title: "Upload Error",
            description: "Failed to upload profile image",
            variant: "destructive",
          });
        } else {
          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("expert-profiles").getPublicUrl(fileName);

          profileImageUrl = publicUrl;
        }
      }

      // 2. Update expert profile
      const { error } = await supabase
        .from("expert_profiles")
        .update({
          name: data.name,
          profile_image_url: profileImageUrl,
          phone: data.phone || null,
          company_website: data.company_website || null,
          x_handle: data.x_handle || null,
          instagram_url: data.instagram_url || null,
          line_url: data.line_url || null,
        })
        .eq("id", expert.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update expert profile",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Profile updated",
        description: "Expert profile has been updated successfully",
      });

      // Refresh expert profile and list
      fetchExpertProfile();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      console.error("Error updating expert profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading expert profile...</div>;
  }

  if (!expert) {
    return (
      <div className="p-4 text-center text-red-500">
        Expert profile not found
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={profileImagePreview || expert.profile_image_url || undefined}
          />
          <AvatarFallback>{getInitials(expert.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{expert.name}</h2>
          <p className="text-gray-500">{expert.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-primary">Expert</Badge>
            {expert.rating_count > 0 && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 bg-white"
              >
                <Star className="text-yellow-500 h-3.5 w-3.5 fill-current" aria-hidden />
                <span>{expert.average_rating.toFixed(1)}</span>
                <span className="text-xs">({expert.rating_count})</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Profile Information</h3>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Profile Image Upload */}
            <div className="space-y-2">
              <FormLabel>Profile Image</FormLabel>
              <Input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleImageChange}
              />
              <FormDescription>
                Recommended size: 500x500 pixels. Maximum size: 5MB. Allowed
                formats: PNG, JPG, WEBP.
              </FormDescription>
            </div>
          </div>

          {/* Web & Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Web & Social Media</h3>

            <FormField
              control={form.control}
              name="company_website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Website</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="x_handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>X / Twitter Handle</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagram_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram URL</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="line_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LINE Profile URL</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
