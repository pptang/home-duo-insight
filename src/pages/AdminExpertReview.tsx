import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Users, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface ExpertApplication {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  profile_image_url: string | null;
  company_website: string | null;
  x_handle: string | null;
  instagram_url: string | null;
  line_url: string | null;
  bio: string;
  region: string;
  specialization_tags: string[];
  status: string;
  created_at: string;
}

const AdminExpertReview = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ExpertApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && isAdmin) {
      fetchApplications();
    }
  }, [user, isAdmin]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("expert_profiles")
        .select("*")
        .in("status", ["pending", "rejected"])
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setApplications(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (application: ExpertApplication) => {
    try {
      setIsLoading(true);

      // Update expert profile status to approved
      const { error: profileError } = await supabase
        .from("expert_profiles")
        .update({ status: "approved" })
        .eq("id", application.id);

      if (profileError) {
        throw profileError;
      }

      // Update user role to expert using Supabase auth admin
      const { error: userError } = await supabase
        .from("profiles")
        .update({ role: "expert" })
        .eq("id", application.id);

      if (userError) {
        throw userError;
      }

      toast({
        title: "Application approved",
        description: `${application.name} is now an approved expert`,
      });

      fetchApplications();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (application: ExpertApplication) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("expert_profiles")
        .update({ status: "rejected" })
        .eq("id", application.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Application rejected",
        description: `${application.name}'s application has been rejected`,
      });

      fetchApplications();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Required</CardTitle>
            <CardDescription>Please sign in to access the admin panel</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>You need admin privileges to access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const pendingApplications = applications.filter(app => app.status === "pending");
  const reviewedApplications = applications.filter(app => app.status !== "pending");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold">Expert Application Review</h1>
          </div>
          <p className="text-muted-foreground">
            Review and manage expert applications for the AiSumai platform
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingApplications.length}</p>
                </div>
                <Clock className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{applications.filter(app => app.status === "approved").length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{applications.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Applications */}
        {pendingApplications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pending Applications ({pendingApplications.length})</h2>
            <div className="space-y-6">
              {pendingApplications.map((application) => (
                <Card key={application.id} className="border-l-4 border-l-accent">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={application.profile_image_url || undefined} />
                          <AvatarFallback>{application.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{application.name}</CardTitle>
                          <CardDescription className="text-base">{application.email}</CardDescription>
                          <p className="text-sm text-muted-foreground mt-1">
                            Applied on {format(new Date(application.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <Clock className="h-4 w-4 mr-1" />
                        Pending Review
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Region</h4>
                        <p>{application.region}</p>
                      </div>
                      {application.phone && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Phone</h4>
                          <p>{application.phone}</p>
                        </div>
                      )}
                    </div>

                    {application.specialization_tags && application.specialization_tags.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Specializations</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.specialization_tags.map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Bio</h4>
                      <p className="text-sm leading-relaxed">{application.bio}</p>
                    </div>

                    {/* Contact Links */}
                    <div className="flex flex-wrap gap-4">
                      {application.company_website && (
                        <a
                          href={application.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Website
                        </a>
                      )}
                      {application.x_handle && (
                        <a
                          href={`https://x.com/${application.x_handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          X/Twitter
                        </a>
                      )}
                      {application.instagram_url && (
                        <a
                          href={application.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Instagram
                        </a>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => handleReject(application)}
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleApprove(application)}
                        disabled={isLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reviewed Applications */}
        {reviewedApplications.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Reviewed Applications</h2>
            <div className="space-y-4">
              {reviewedApplications.map((application) => (
                <Card key={application.id} className="opacity-75">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={application.profile_image_url || undefined} />
                          <AvatarFallback>{application.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{application.name}</p>
                          <p className="text-sm text-muted-foreground">{application.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(application.created_at), "MMM d, yyyy")}
                        </p>
                        <Badge 
                          variant={application.status === "approved" ? "default" : "secondary"}
                          className={application.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {application.status === "approved" ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {applications.length === 0 && !isLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground">
                Expert applications will appear here when users submit them.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminExpertReview;