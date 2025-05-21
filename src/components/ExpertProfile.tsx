import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExpertRating } from "./ExpertRating";
import { Star, Mail, Phone, Link as LinkIcon } from "lucide-react";

interface ExpertProfileProps {
  expertId: string;
  className?: string;
  showRating?: boolean;
}

interface ExpertProfile {
  id: string;
  user_id: string;
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

export function ExpertProfile({
  expertId,
  className,
  showRating = true,
}: ExpertProfileProps) {
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!expert) {
    return (
      <Card className={`p-4 ${className}`}>
        <p className="text-gray-500">Expert profile not found</p>
      </Card>
    );
  }

  console.log("test", expert.profile_image_url);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={expert.profile_image_url || undefined}
              alt={`${expert.name}'s profile photo`}
            />
            <AvatarFallback>{getInitials(expert.name)}</AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{expert.name}</h2>
              <Badge className="bg-[#C2A9FF]">Expert</Badge>
            </div>

            {expert.rating_count > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">
                  {expert.average_rating.toFixed(1)}
                </span>
                <span className="text-gray-500 text-sm">
                  ({expert.rating_count} ratings)
                </span>
              </div>
            )}

            {showRating && (
              <ExpertRating
                expertId={expertId}
                className="mt-3"
                onRatingSubmitted={fetchExpertProfile}
              />
            )}
          </div>
        </div>

        {/* Contact information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <a
              href={`mailto:${expert.email}`}
              className="text-[#6A7FDB] hover:underline"
            >
              {expert.email}
            </a>
          </div>

          {expert.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <a
                href={`tel:${expert.phone}`}
                className="text-[#6A7FDB] hover:underline"
              >
                {expert.phone}
              </a>
            </div>
          )}

          {expert.company_website && (
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-gray-500" />
              <a
                href={expert.company_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6A7FDB] hover:underline"
              >
                Company Website
              </a>
            </div>
          )}
        </div>

        {/* Social media */}
        <div className="flex flex-wrap gap-2">
          {expert.x_handle && (
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <a
                href={`https://twitter.com/${expert.x_handle.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                𝕏 Twitter
              </a>
            </Button>
          )}

          {expert.instagram_url && (
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <a
                href={expert.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </Button>
          )}

          {expert.line_url && (
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <a
                href={expert.line_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                LINE
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
