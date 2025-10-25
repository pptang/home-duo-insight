
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  ThumbsUp,
  Building,
  Home,
  Search,
  Filter,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FeedExpertVoting } from "@/components/FeedExpertVoting";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { PropertyImageDisplay } from "@/components/PropertyImageDisplay";
import ExpertAvatarGroup from "@/components/ExpertAvatarGroup";
import { useTranslation } from "react-i18next";

interface Expert {
  id: string;
  name: string;
  profile_image_url: string | null;
}

interface Property {
  id: string;
  property_name: string | null;
  price_yen: number | null;
  floor_plan: string | null;
  image_urls: string[] | null;
  property_type: string | null;
}

interface ComparisonPost {
  id: string;
  created_at: string;
  user_id: string | null;
  propertyA: Property;
  propertyB: Property;
  ai_recommendation_text?: string | null;
  userName?: string;
  userAvatar?: string;
  expertVotes?: number;
  image_extraction_status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  communityVotes?: number;
  comments?: number;
  experts?: Expert[];
}

const Feed = () => {
  const { t } = useTranslation();
  const { isExpert, user } = useAuth();
  const { toast } = useToast();
  const [comparisons, setComparisons] = useState<ComparisonPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [votedComparisons, setVotedComparisons] = useState<
    Record<string, boolean>
  >({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparisons = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch comparisons with their linked properties (without profiles for now)
        const { data: comparisonsData, error: comparisonsError } =
          await supabase
            .from("comparisons")
            .select(
              `
            *,
            propertyA:property_a_id(id, property_name, price_yen, floor_plan, image_urls, property_type),
            propertyB:property_b_id(id, property_name, price_yen, floor_plan, image_urls, property_type)
          `
            )
            .order("created_at", { ascending: false });

        if (comparisonsError) {
          console.error("Error fetching comparisons:", comparisonsError);
          setError("Failed to load comparisons. Please refresh.");
          return;
        }

        if (!comparisonsData || comparisonsData.length === 0) {
          setComparisons([]);
          setIsLoading(false);
          return;
        }

        // Get unique user IDs for profile fetching
        const userIds = [...new Set(comparisonsData
          .map(c => c.user_id)
          .filter(Boolean)
        )];

        // Fetch profiles for all users
        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

          if (!profilesError && profilesData) {
            profilesMap = profilesData.reduce((acc, profile) => ({
              ...acc,
              [profile.id]: profile
            }), {});
          }
        }

        // Transform the data to include author information
        const transformedData: ComparisonPost[] = comparisonsData
          .map((comparison) => {
            // Ensure properties are correctly typed
            if (
              !comparison.propertyA ||
              !comparison.propertyB ||
              typeof comparison.propertyA === "string" ||
              typeof comparison.propertyB === "string"
            ) {
              console.error("Invalid property data in comparison:", comparison);
              return null;
            }

            // Get author profile from our profiles map
            const authorProfile = comparison.user_id ? profilesMap[comparison.user_id] : null;

            return {
              id: comparison.id,
              created_at: comparison.created_at,
              user_id: comparison.user_id,
              propertyA: comparison.propertyA as Property,
              propertyB: comparison.propertyB as Property,
              userName: authorProfile?.full_name || "Anonymous User",
              userAvatar: authorProfile?.avatar_url || undefined,
              expertVotes: 0, // Will be updated with aggregation later
              communityVotes: 0, // Will be updated with aggregation later
              comments: 0, // Will be updated with aggregation later
              experts: [], // Will be populated with expert data
            };
          })
          .filter(Boolean) as ComparisonPost[];

        // Fetch vote counts and expert data for each comparison
        await Promise.all(
          transformedData.map(async (comparison) => {
            // Get votes with expert profiles
            const { data: votesData, error: votesError } = await supabase
              .from("votes")
              .select(
                `
                id,
                expert_user_id,
                voted_for,
                expert_profiles!inner(
                  id,
                  name,
                  profile_image_url
                )
              `
              )
              .eq("comparison_id", comparison.id);

            if (!votesError && votesData) {
              comparison.expertVotes = votesData.length;

              // Extract unique experts from votes
              const uniqueExperts: Record<string, Expert> = {};

              votesData.forEach((vote) => {
                // Make sure expert profile data exists
                if (vote.expert_profiles && typeof vote.expert_profiles === "object") {
                  const expert = vote.expert_profiles as { id: string; name: string; profile_image_url: string | null };
                  uniqueExperts[vote.expert_user_id] = {
                    id: vote.expert_user_id,
                    name: expert.name || "Expert",
                    profile_image_url: expert.profile_image_url,
                  };
                }
              });

              comparison.experts = Object.values(uniqueExperts);
            }

            // For now, we don't have community votes and comments tables
            // When implemented, similar queries would be added here
            comparison.communityVotes = 0;
            comparison.comments = 0;
          })
        );

        setComparisons(transformedData);
      } catch (err) {
        console.error("Unexpected error fetching comparisons:", err);
        setError("Failed to load comparisons. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisons();
  }, [refreshTrigger]);

  useEffect(() => {
    if (isExpert && user) {
      // Check which comparisons the expert has already voted on
      const checkExpertVotes = async () => {
        try {
          const { data, error } = await supabase
            .from("votes")
            .select("comparison_id")
            .eq("expert_user_id", user.id);

          if (error) {
            console.error("Error fetching expert votes:", error);
            return;
          }

          if (data) {
            const votedIds = data.reduce<Record<string, boolean>>(
              (acc, vote) => ({ ...acc, [vote.comparison_id]: true }),
              {}
            );
            setVotedComparisons(votedIds);
          }
        } catch (error) {
          console.error("Unexpected error checking votes:", error);
        }
      };

      checkExpertVotes();
    }
  }, [isExpert, user, refreshTrigger]);

  const handleVoteSubmitted = (comparisonId: string) => {
    setVotedComparisons((prev) => ({ ...prev, [comparisonId]: true }));
    setRefreshTrigger((prev) => prev + 1);
  };

  // Format yen price to show in a nice format
  const formatYenPrice = (price: number | null): string => {
    if (price === null) return t("feed.card.price_unavailable");

    // If price is >= 10,000,000 yen, show in millions
    if (price >= 10000000) {
      return `¥${(price / 1000000).toFixed(1)}M`;
    }

    // Otherwise show in thousands
    if (price >= 1000) {
      return `¥${(price / 1000).toFixed(0)}K`;
    }

    return `¥${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      {/* Immersive Hero Section */}
      <section className="hero-landscape relative py-16 md:py-20 overflow-hidden">
        <div className="parallax-layer absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90"></div>
        <div className="parallax-layer absolute inset-0" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')", opacity: 0.2}}></div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-5xl md:text-6xl micro-animation">📊</span>
              <h1 className="cinematic-heading text-white text-4xl md:text-6xl font-bold leading-tight">
                {t("feed.title")}
              </h1>
              <span className="text-5xl md:text-6xl micro-animation">🏘️</span>
            </div>
            
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              {t("feed.subtitle")}
            </p>
            
            <div className="mt-8">
              <Button asChild className="gradient-cta text-white px-6 py-3 h-auto hover-glow transition-all duration-300 transform hover:scale-105">
                <Link to="/compare" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span>{t("feed.create_comparison")}</span>
                  <span className="text-lg">✨</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-grow bg-background relative z-10 -mt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">

            {/* Modern Search and Filters */}
            <div className="section-fade animate-in bg-card rounded-2xl shadow-xl p-6 border border-border">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                <div className="relative flex-grow group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder={t("feed.search_placeholder")}
                    className="w-full pl-12 pr-4 py-4 bg-background border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 text-foreground placeholder:text-muted-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="px-6 py-4 h-auto border-2 hover:bg-secondary/20 hover:border-secondary transition-all duration-300 group"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <Filter className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="ml-2">{t("feed.filters")}</span>
                  {filterOpen && <span className="ml-1 animate-pulse">✨</span>}
                </Button>
              </div>

              {filterOpen && (
                <div className="mt-6 p-6 bg-secondary/5 rounded-xl border border-secondary/20 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("feed.filter.property_type")}
                    </label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="">{t("feed.filter.all_types")}</option>
                      <option value="apartment">{t("feed.filter.apartment")}</option>
                      <option value="house">{t("feed.filter.house")}</option>
                      <option value="condo">{t("feed.filter.condo")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("feed.filter.price_range")}
                    </label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="">{t("feed.filter.any_price")}</option>
                      <option value="rental-low">{t("feed.filter.rental_low")}</option>
                      <option value="rental-mid">{t("feed.filter.rental_mid")}</option>
                      <option value="rental-high">{t("feed.filter.rental_high")}</option>
                      <option value="purchase-low">{t("feed.filter.purchase_low")}</option>
                      <option value="purchase-mid">{t("feed.filter.purchase_mid")}</option>
                      <option value="purchase-high">{t("feed.filter.purchase_high")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("feed.filter.sort_by")}
                    </label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="recent">{t("feed.filter.most_recent")}</option>
                      <option value="popular">{t("feed.filter.most_popular")}</option>
                      <option value="votes">{t("feed.filter.most_expert_votes")}</option>
                      <option value="comments">{t("feed.filter.most_comments")}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="mt-8 space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Skeleton className="h-24 rounded-lg" />
                        <Skeleton className="h-24 rounded-lg" />
                      </div>
                      <Skeleton className="h-16 rounded-lg mb-4" />
                      <div className="flex justify-between">
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-8 w-32" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertTriangle className="text-red-500 mr-2" />
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setRefreshTrigger((prev) => prev + 1)}
                >
                  {t("feed.error.retry")}
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && comparisons.length === 0 && (
              <div className="mt-8 bg-white rounded-lg border p-8 text-center">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("feed.empty.title")}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t("feed.empty.subtitle")}
                  </p>
                  <Button asChild>
                    <Link to="/compare">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("feed.empty.button")}
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Comparison Posts */}
            {!isLoading && !error && comparisons.length > 0 && (
              <div className="mt-8 space-y-6">
                {comparisons.map((comparison) => (
                  <div
                    key={comparison.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-300">
                          {comparison.userAvatar ? (
                            <img
                              src={comparison.userAvatar}
                              alt={comparison.userName || "User"}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#6A7FDB] flex items-center justify-center text-white font-medium">
                              {comparison.userName?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {comparison.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(
                              comparison.created_at
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {comparison.propertyA.property_name || "Property A"} vs{" "}
                        {comparison.propertyB.property_name || "Property B"}
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-softgray p-3 rounded-lg">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center">
                            <PropertyImageDisplay
                              imageUrls={comparison.propertyA.image_urls}
                              propertyName={comparison.propertyA.property_name || "Property A"}
                              imageExtractionStatus={comparison.image_extraction_status}
                              className="w-16 h-16 mr-3 mb-2 sm:mb-0"
                              aspectRatio="square"
                            />
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {comparison.propertyA.property_name ||
                                  "Property A"}
                              </h3>
                              <p className="text-primary font-medium mt-1">
                                {comparison.propertyA.price_yen !== null
                                  ? formatYenPrice(
                                      comparison.propertyA.price_yen
                                    )
                                  : "Price unavailable"}
                              </p>
                              {comparison.propertyA.floor_plan && (
                                <p className="text-sm text-gray-600">
                                  {comparison.propertyA.floor_plan}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-softgray p-3 rounded-lg">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center">
                            <PropertyImageDisplay
                              imageUrls={comparison.propertyB.image_urls}
                              propertyName={comparison.propertyB.property_name || "Property B"}
                              imageExtractionStatus={comparison.image_extraction_status}
                              className="w-16 h-16 mr-3 mb-2 sm:mb-0"
                              aspectRatio="square"
                            />
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {comparison.propertyB.property_name ||
                                  "Property B"}
                              </h3>
                              <p className="text-primary font-medium mt-1">
                                {comparison.propertyB.price_yen !== null
                                  ? formatYenPrice(
                                      comparison.propertyB.price_yen
                                    )
                                  : "Price unavailable"}
                              </p>
                              {comparison.propertyB.floor_plan && (
                                <p className="text-sm text-gray-600">
                                  {comparison.propertyB.floor_plan}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {comparison.ai_recommendation_text && (
                        <div className="bg-softgray p-4 rounded-lg mb-4">
                          <h4 className="font-medium text-gray-900">
                            {t("feed.card.ai_recommendation")}
                          </h4>
                          <p className="mt-1 text-gray-600">
                            {comparison.ai_recommendation_text.length > 200
                              ? `${comparison.ai_recommendation_text.slice(
                                  0,
                                  200
                                )}...`
                              : comparison.ai_recommendation_text}
                          </p>
                        </div>
                      )}

                      {/* Expert Voting Section */}
                      {isExpert && (
                        <div className="border-t border-gray-100 pt-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {t("feed.card.expert_voting")}
                            </Badge>
                          </div>
                          <FeedExpertVoting
                            comparisonId={comparison.id}
                            propertyAName={
                              comparison.propertyA.property_name || "Property A"
                            }
                            propertyBName={
                              comparison.propertyB.property_name || "Property B"
                            }
                            hasVoted={!!votedComparisons[comparison.id]}
                            onVoteSubmitted={() =>
                              handleVoteSubmitted(comparison.id)
                            }
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between">
                        <div className="flex flex-wrap items-center gap-4">
                          {/* Expert Avatar Group */}
                          {comparison.experts &&
                            comparison.experts.length > 0 && (
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                <ExpertAvatarGroup
                                  experts={comparison.experts}
                                  maxVisible={5}
                                />
                              </div>
                            )}
                          {!comparison.experts ||
                          comparison.experts.length === 0 ? (
                            <div className="flex items-center text-gray-600">
                              <Building className="h-4 w-4 mr-1" />
                              <span className="text-sm">
                                {t(comparison.expertVotes === 1 ? "feed.card.expert_votes" : "feed.card.expert_votes_plural", { count: comparison.expertVotes })}
                              </span>
                            </div>
                          ) : null}
                          <div className="flex items-center text-gray-600">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {t(comparison.communityVotes === 1 ? "feed.card.community_vote" : "feed.card.community_votes", { count: comparison.communityVotes })}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {t(comparison.comments === 1 ? "feed.card.comment" : "feed.card.comments", { count: comparison.comments })}
                            </span>
                          </div>
                        </div>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="mt-2 sm:mt-0"
                        >
                          <Link to={`/comparisons/${comparison.id}`}>
                            {t("feed.card.view_full")}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feed;
