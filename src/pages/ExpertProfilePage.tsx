import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ExpertProfile } from "@/components/ExpertProfile";
import ExpertProfileEditForm from "@/components/ExpertProfileEditForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BookOpen, Building, MapPin, Edit } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

interface ExpertActivity {
  totalVotes: number;
}

type ExpertProfileType = Database["public"]["Tables"]["expert_profiles"]["Row"];

const ExpertProfilePage: React.FC = () => {
  const { expertId } = useParams<{ expertId: string }>();
  const [expertProfile, setExpertProfile] = useState<ExpertProfileType | null>(
    null
  );
  const [activity, setActivity] = useState<ExpertActivity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const isOwnProfile =
    user && expertProfile ? user.id === expertProfile.id : false;

  // Fetch expert profile and vote activity
  useEffect(() => {
    const fetchExpertData = async () => {
      if (!expertId) return;

      setIsLoading(true);
      try {
        // Get expert profile
        const { data: profileData, error: profileError } = await supabase
          .from("expert_profiles")
          .select("*")
          .eq("id", expertId)
          .single();

        if (profileError) {
          console.error("Error fetching expert profile:", profileError);
          return;
        }

        setExpertProfile(profileData);

        // Get total vote count
        const { count, error: voteError } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("expert_user_id", expertId);

        if (voteError) {
          console.error("Error fetching expert activity:", voteError);
          return;
        }

        setActivity({
          totalVotes: count || 0,
        });
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpertData();
  }, [expertId]);

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleProfileUpdate = () => {
    setEditMode(false);
    // Refetch profile to get updated data
    fetchExpertProfile();
  };

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

  if (!expertId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Expert ID not provided
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Expert Profile
          </h1>
          <p className="text-muted-foreground">
            Verified real estate expert on DuoHome Advisor
          </p>
        </div>

        {isOwnProfile && !editMode && (
          <Button onClick={handleEditToggle} className="gap-2">
            <Edit className="h-4 w-4" /> Edit Profile
          </Button>
        )}
      </div>

      {/* Main profile section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column - Expert profile info */}
        <div className="md:col-span-2">
          {editMode ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Edit Your Profile</CardTitle>
                <CardDescription>
                  Update your information and profile image
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expertProfile && (
                  <ExpertProfileEditForm
                    profile={expertProfile}
                    onCancel={handleEditToggle}
                    onUpdate={handleProfileUpdate}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <ExpertProfile expertId={expertId} className="mb-6" />

              {/* Specialization */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Expertise & Specialization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Bio section */}
                  {expertProfile?.bio && (
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">About</h3>
                      <p className="text-muted-foreground">
                        {expertProfile.bio}
                      </p>
                    </div>
                  )}

                  {/* This would ideally come from the profile data */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>
                        Tokyo Metropolitan Area (主に東京都23区と近郊)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>
                        Foreign-friendly rental properties, Investment
                        properties, Expat relocation assistance
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Right column - Activity and stats */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>
                Expert's contribution on DuoHome
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-lg font-medium block">
                      {activity?.totalVotes || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Total property comparisons evaluated
                    </span>
                  </div>

                  <Separator />

                  <div className="pt-2">
                    {!editMode && expertProfile?.email && (
                      <Button className="w-full" asChild>
                        <a href={`mailto:${expertProfile.email}`}>
                          Contact Expert
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExpertProfilePage;
