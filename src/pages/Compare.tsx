import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowDown,
  CheckCircle,
  ImageIcon,
  ThumbsDown,
  ThumbsUp,
  Upload,
  XCircle,
} from "lucide-react";
import { PropertyImageDisplay } from "@/components/PropertyImageDisplay";
import { useComparisonSubscription } from "@/hooks/use-comparison-subscription";
import { MetadataEditingProvider, useMetadataEditing } from "@/contexts/MetadataEditingContext";
import { MetadataReviewStage } from "@/components/MetadataReviewStage";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { ExpertSection } from "@/components/ExpertSection";

interface PropertyData {
  id: string;
  property_name?: string;
  address?: string;
  price_yen?: number;
  floor_plan?: string;
  commute_minutes?: number;
  property_type?: string;
  image_urls: string[];
  notes?: string;
  // New enhanced fields
  private_area_sqm?: number;
  construction_year?: number;
  construction_month?: number;
  building_age_years?: number;
}

interface ComparisonResult {
  comparison_id: string;
  property_a: PropertyData;
  property_b: PropertyData;
  image_extraction_status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface AIRecommendation {
  property_a_pros: string[];
  property_a_cons: string[];
  property_b_pros: string[];
  property_b_cons: string[];
  summary_table: {
    field: string;
    property_a: string;
    property_b: string;
  }[];
  final_recommendation: string;
}

// Improved URL validation schema
const urlSchema = z.object({
  property_url_a: z
    .string()
    .url("Must be a valid URL")
    .min(5, "Property A URL is too short")
    .refine(
      (url) => url.startsWith("http"),
      "URL must start with http:// or https://"
    ),
  property_url_b: z
    .string()
    .url("Must be a valid URL")
    .min(5, "Property B URL is too short")
    .refine(
      (url) => url.startsWith("http"),
      "URL must start with http:// or https://"
    ),
});

const personalizationSchema = z.object({
  has_pets: z.boolean().default(false),
  works_from_home: z.boolean().default(false),
  family_size: z.number().min(1).max(10).default(1),
  commute_priority: z.number().min(1).max(5).default(3),
  why_move: z.string().max(500).default(""),
  top_priority_1: z.string().max(100).default(""),
  top_priority_2: z.string().max(100).default(""),
  top_priority_3: z.string().max(100).default(""),
});

type FormValues = z.infer<typeof urlSchema>;
type PersonalizationValues = z.infer<typeof personalizationSchema>;

// Function to extract URLs from pasted text
const extractUrlFromText = (text: string): string => {
  // Remove any leading/trailing whitespace
  const trimmed = text.trim();

  // URL regex pattern to match http/https URLs
  const urlRegex = /(https?:\/\/[^\s]+)/gi;

  // Find all URLs in the text
  const matches = trimmed.match(urlRegex);

  // If URLs are found, return the first one
  if (matches && matches.length > 0) {
    return matches[0];
  }

  // If no URLs found, return the original text (user might have pasted a URL without protocol)
  return trimmed;
};

const Compare = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] =
    useState(false);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [aiRecommendation, setAiRecommendation] =
    useState<AIRecommendation | null>(null);
  const [showPersonalizationDialog, setShowPersonalizationDialog] =
    useState(false);
  const [currentStage, setCurrentStage] = useState<'url-input' | 'metadata-review' | 'full-comparison'>('url-input');
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle retry image extraction
  const handleRetryImageExtraction = async (comparisonId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('retry-image-extraction', {
        body: { comparison_id: comparisonId }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Retry failed",
          description: "Could not retry image extraction. Please try again later.",
        });
        return;
      }

      toast({
        title: "Retry started",
        description: "Image extraction has been restarted. Please wait...",
      });
    } catch (error) {
      console.error('Retry image extraction error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while retrying.",
      });
    }
  };

  // Subscribe to real-time updates for image extraction
  useComparisonSubscription({
    comparisonId: comparisonResult?.comparison_id || '',
    onImageExtractionComplete: async () => {
      // Refresh the comparison data to get the updated images
      if (comparisonResult?.comparison_id) {
        try {
          const { data: refreshedData, error } = await supabase
            .from('comparisons')
            .select(`
              *,
              property_a:properties!comparisons_property_a_id_fkey(*),
              property_b:properties!comparisons_property_b_id_fkey(*)
            `)
            .eq('id', comparisonResult.comparison_id)
            .single();

          if (!error && refreshedData) {
            setComparisonResult({
              comparison_id: refreshedData.id,
              property_a: refreshedData.property_a as PropertyData,
              property_b: refreshedData.property_b as PropertyData,
              image_extraction_status: refreshedData.image_extraction_status as 'pending' | 'in_progress' | 'completed' | 'failed'
            });

            toast({
              title: "Images loaded!",
              description: "Property images have been successfully extracted.",
            });
          }
        } catch (error) {
          console.error('Error refreshing comparison data:', error);
        }
      }
    },
    onImageExtractionStatusChange: (status) => {
      if (comparisonResult) {
        setComparisonResult({
          ...comparisonResult,
          image_extraction_status: status
        });
      }
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      property_url_a: "",
      property_url_b: "",
    },
  });

  const personalizationForm = useForm<PersonalizationValues>({
    resolver: zodResolver(personalizationSchema),
    defaultValues: {
      has_pets: false,
      works_from_home: false,
      family_size: 1,
      commute_priority: 3,
      why_move: "",
      top_priority_1: "",
      top_priority_2: "",
      top_priority_3: "",
    },
  });

  const handleAnalyzeProperties = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Show loading stages for better user feedback
      setLoadingStage("Fetching property webpages...");

      // Call the Supabase Edge Function with user_id
      const { data, error } = await supabase.functions.invoke(
        "analyze-properties",
        {
          body: {
            property_url_a: values.property_url_a,
            property_url_b: values.property_url_b,
            user_id: user?.id || null, // Include user_id if logged in
          },
        }
      );

      if (error) {
        console.error("Edge function error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Could not extract data. Please check the URLs or try another.",
        });
        return;
      }

      if (data.error) {
        console.error("API error:", data.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error,
        });
        return;
      }

      // Success - set comparison result and move to metadata review stage
      setComparisonResult(data);
      setCurrentStage('metadata-review');
      toast({
        title: "Success",
        description: "Properties analyzed successfully! Please review the details.",
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setLoadingStage(null);
    }
  };

  const resetForm = () => {
    form.reset();
    setComparisonResult(null);
    setAiRecommendation(null);
    setCurrentStage('url-input');
  };

  const handleGetRecommendation = async (values: PersonalizationValues) => {
    if (!comparisonResult) return;

    setIsGeneratingRecommendation(true);
    setShowPersonalizationDialog(false);

    try {
      // Store preferences for recommendation generation
      // Note: These fields may need to be added to the comparisons table schema
      const preferences = {
        why_move: values.why_move,
        top_priority_1: values.top_priority_1,
        top_priority_2: values.top_priority_2,
        top_priority_3: values.top_priority_3
      };

      const { data, error } = await supabase.functions.invoke(
        "generate-recommendation",
        {
          body: {
            comparison_id: comparisonResult.comparison_id,
            property_a: comparisonResult.property_a,
            property_b: comparisonResult.property_b,
            user_profile: values,
            user_id: user?.id || null, // Include user_id if logged in
          },
        }
      );

      if (error) {
        console.error("Recommendation error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not generate recommendation. Please try again.",
        });
        return;
      }

      // Success - set AI recommendation
      setAiRecommendation(data);
      toast({
        title: "Success",
        description: "Recommendation generated successfully!",
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "We couldn't generate your recommendation. Please try again.",
      });
    } finally {
      setIsGeneratingRecommendation(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Immersive Hero with Step Indicator */}
      <div className="hero-landscape relative py-16 md:py-24 overflow-hidden">
        <div className="parallax-layer absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90"></div>
        <div className="parallax-layer absolute inset-0" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')", opacity: 0.3}}></div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="cinematic-heading text-white mb-6">
            <span className="text-5xl md:text-7xl font-black">🏠</span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mt-4">
              Compare Properties
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Get AI insights, expert opinions, and make confident decisions with
            <span className="font-semibold text-accent"> AiSumai (愛住)</span>
          </p>

          {/* Dynamic Step Progress */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-4 md:space-x-8">
              <div className={`flex items-center space-x-2 transition-all duration-500 ${currentStage === 'url-input' ? 'scale-110 text-accent' : 'text-white/70'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${currentStage === 'url-input' ? 'bg-accent text-primary animate-pulse' : 'bg-white/20'}`}>
                  1
                </div>
                <span className="hidden md:block font-medium">Parse URLs</span>
              </div>

              <div className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full bg-accent transition-all duration-700 ${currentStage !== 'url-input' ? 'w-full' : 'w-0'}`}></div>
              </div>

              <div className={`flex items-center space-x-2 transition-all duration-500 ${currentStage === 'metadata-review' ? 'scale-110 text-accent' : currentStage === 'full-comparison' ? 'text-white' : 'text-white/50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${currentStage === 'metadata-review' ? 'bg-accent text-primary animate-pulse' : currentStage === 'full-comparison' ? 'bg-white/20' : 'bg-white/10'}`}>
                  2
                </div>
                <span className="hidden md:block font-medium">Review Details</span>
              </div>

              <div className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full bg-accent transition-all duration-700 ${currentStage === 'full-comparison' ? 'w-full' : 'w-0'}`}></div>
              </div>

              <div className={`flex items-center space-x-2 transition-all duration-500 ${currentStage === 'full-comparison' ? 'scale-110 text-accent' : 'text-white/50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${currentStage === 'full-comparison' ? 'bg-accent text-primary animate-pulse' : 'bg-white/10'}`}>
                  3
                </div>
                <span className="hidden md:block font-medium">Get Insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow bg-background relative z-10 -mt-16">
        <MetadataEditingProvider>
          <CompareContent
            currentStage={currentStage}
            setCurrentStage={setCurrentStage}
            comparisonResult={comparisonResult}
            aiRecommendation={aiRecommendation}
            isLoading={isLoading}
            loadingStage={loadingStage}
            form={form}
            handleAnalyzeProperties={handleAnalyzeProperties}
            resetForm={resetForm}
            showPersonalizationDialog={showPersonalizationDialog}
            setShowPersonalizationDialog={setShowPersonalizationDialog}
            personalizationForm={personalizationForm}
            handleGetRecommendation={handleGetRecommendation}
            isGeneratingRecommendation={isGeneratingRecommendation}
            handleRetryImageExtraction={handleRetryImageExtraction}
          />
        </MetadataEditingProvider>
      </main>
    </div>
  );
};

const CompareContent: React.FC<any> = ({
  currentStage,
  setCurrentStage,
  comparisonResult,
  aiRecommendation,
  isLoading,
  loadingStage,
  form,
  handleAnalyzeProperties,
  resetForm,
  showPersonalizationDialog,
  setShowPersonalizationDialog,
  personalizationForm,
  handleGetRecommendation,
  isGeneratingRecommendation,
  handleRetryImageExtraction
}) => {
  const { initializeProperties, setStage, state } = useMetadataEditing();

  // Get the most up-to-date property data (edited if available, original if not)
  const getPropertyData = (propertyKey: 'property_a' | 'property_b') => {
    // If we have edited properties in context, use those
    if (state.editedProperties[propertyKey]?.id) {
      return state.editedProperties[propertyKey];
    }
    // Otherwise, use the comparison result data
    return propertyKey === 'property_a' ? comparisonResult.property_a : comparisonResult.property_b;
  };

  // Function to format price in Japanese Yen
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Helper functions for formatting new fields
  const formatArea = (area?: number): string => {
    if (!area) return "N/A";
    return `${area}㎡`;
  };

  const formatBuildingAge = (age?: number): string => {
    if (!age) return "N/A";
    return `${Math.floor(age)} years old`;
  };

  const formatConstructionDate = (year?: number, month?: number): string => {
    if (!year) return "N/A";
    if (!month) return `Built in ${year}`;
    return `Built in ${year}年${month}月`;
  };

  // Initialize metadata editing when we get comparison results
  React.useEffect(() => {
    if (comparisonResult && currentStage === 'metadata-review') {
      initializeProperties(
        comparisonResult.property_a,
        comparisonResult.property_b,
        comparisonResult.comparison_id
      );
      setStage('metadata-review');
    }
    if (currentStage === 'full-comparison') {
      setStage('full-comparison');
    }
  }, [comparisonResult, currentStage, initializeProperties, setStage]);

  // Listen for metadata editing completion
  React.useEffect(() => {
    const handleMetadataComplete = () => {
      setCurrentStage('full-comparison');
    };

    window.addEventListener('metadataEditingComplete', handleMetadataComplete);
    return () => window.removeEventListener('metadataEditingComplete', handleMetadataComplete);
  }, [setCurrentStage]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {currentStage === 'url-input' && (
              <div className="section-fade animate-in bg-card rounded-2xl shadow-xl p-8 md:p-10 border border-border">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4 micro-animation">🏡</div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Start Your Property Journey
                  </h2>
                  <p className="text-muted-foreground">
                    Paste property URLs and let AI guide your decision
                  </p>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleAnalyzeProperties)}
                    className="space-y-8"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="property_url_a"
                        render={({ field }) => (
                          <FormItem className="group">
                            <FormLabel className="flex items-center gap-2 font-medium text-foreground">
                              <span className="text-2xl">🏠</span>
                              Property A URL
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="https://suumo.jp/property/..."
                                  {...field}
                                  className="pl-12 h-12 bg-background border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:shadow-lg"
                                  disabled={isLoading}
                                  onPaste={(e) => {
                                    e.preventDefault();
                                    const pastedText = e.clipboardData.getData('text');
                                    const extractedUrl = extractUrlFromText(pastedText);
                                    field.onChange(extractedUrl);
                                  }}
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  🔗
                                </div>
                                {field.value && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-bounce">
                                    ✨
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="property_url_b"
                        render={({ field }) => (
                          <FormItem className="group">
                            <FormLabel className="flex items-center gap-2 font-medium text-foreground">
                              <span className="text-2xl">🏘️</span>
                              Property B URL
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="https://athome.co.jp/property/..."
                                  {...field}
                                  className="pl-12 h-12 bg-background border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 group-hover:shadow-lg"
                                  disabled={isLoading}
                                  onPaste={(e) => {
                                    e.preventDefault();
                                    const pastedText = e.clipboardData.getData('text');
                                    const extractedUrl = extractUrlFromText(pastedText);
                                    field.onChange(extractedUrl);
                                  }}
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  🔗
                                </div>
                                {field.value && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-bounce">
                                    ✨
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="text-center pt-4">
                      <Button
                        size="lg"
                        type="submit"
                        disabled={isLoading || !form.formState.isValid}
                        className="gradient-cta text-white px-8 py-4 h-auto text-lg font-semibold hover-glow transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="animate-pulse">
                              {loadingStage || "Analyzing properties..."}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>🚀 Analyze Properties</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
        )}

        {currentStage === 'metadata-review' && (
          <MetadataReviewStage />
        )}

        {currentStage === 'full-comparison' && (
          <div className="mt-8 animate-fade-in">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {/* Property A */}
                    <div className="p-6">
                      <PropertyImageDisplay
                        imageUrls={getPropertyData('property_a').image_urls}
                        propertyName={getPropertyData('property_a').property_name}
                        imageExtractionStatus={comparisonResult.image_extraction_status}
                        className="mb-4"
                        aspectRatio="video"
                        comparisonId={comparisonResult.comparison_id}
                        onRetryImageExtraction={handleRetryImageExtraction}
                      />
                      <h3 className="text-xl font-semibold text-gray-900">
                        {getPropertyData('property_a').property_name}
                      </h3>
                      <p className="text-[#6A7FDB] font-medium">
                        {formatPrice(getPropertyData('property_a').price_yen)}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium text-right">
                            {getPropertyData('property_a').address}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Floor Plan:</span>
                          <span className="font-medium">
                            {getPropertyData('property_a').floor_plan}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Private Area:</span>
                          <span className="font-medium">
                            {formatArea(getPropertyData('property_a').private_area_sqm)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commute Time:</span>
                          <span className="font-medium">
                            {getPropertyData('property_a').commute_minutes ?
                              `${getPropertyData('property_a').commute_minutes} minutes` :
                              "N/A"
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Building Age:</span>
                          <span className="font-medium">
                            {formatBuildingAge(getPropertyData('property_a').building_age_years)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Construction:</span>
                          <span className="font-medium">
                            {formatConstructionDate(
                              getPropertyData('property_a').construction_year,
                              getPropertyData('property_a').construction_month
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Property Type:</span>
                          <span className="font-medium">
                            {getPropertyData('property_a').property_type}
                          </span>
                        </div>
                        {comparisonResult.property_a.notes && (
                          <div className="mt-2">
                            <span className="text-gray-600 block">Notes:</span>
                            <p className="mt-1 text-sm">
                              {comparisonResult.property_a.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property B */}
                    <div className="p-6">
                      <PropertyImageDisplay
                        imageUrls={getPropertyData('property_b').image_urls}
                        propertyName={getPropertyData('property_b').property_name}
                        imageExtractionStatus={comparisonResult.image_extraction_status}
                        className="mb-4"
                        aspectRatio="video"
                        comparisonId={comparisonResult.comparison_id}
                        onRetryImageExtraction={handleRetryImageExtraction}
                      />
                      <h3 className="text-xl font-semibold text-gray-900">
                        {getPropertyData('property_b').property_name}
                      </h3>
                      <p className="text-[#6A7FDB] font-medium">
                        {formatPrice(getPropertyData('property_b').price_yen)}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium text-right">
                            {getPropertyData('property_b').address}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Floor Plan:</span>
                          <span className="font-medium">
                            {getPropertyData('property_b').floor_plan}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Private Area:</span>
                          <span className="font-medium">
                            {formatArea(getPropertyData('property_b').private_area_sqm)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commute Time:</span>
                          <span className="font-medium">
                            {getPropertyData('property_b').commute_minutes ?
                              `${getPropertyData('property_b').commute_minutes} minutes` :
                              "N/A"
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Building Age:</span>
                          <span className="font-medium">
                            {formatBuildingAge(getPropertyData('property_b').building_age_years)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Construction:</span>
                          <span className="font-medium">
                            {formatConstructionDate(
                              getPropertyData('property_b').construction_year,
                              getPropertyData('property_b').construction_month
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Property Type:</span>
                          <span className="font-medium">
                            {getPropertyData('property_b').property_type}
                          </span>
                        </div>
                        {comparisonResult.property_b.notes && (
                          <div className="mt-2">
                            <span className="text-gray-600 block">Notes:</span>
                            <p className="mt-1 text-sm">
                              {comparisonResult.property_b.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Get Recommendation Button */}
                <div className="text-center mb-8">
                  <Button
                    size="lg"
                    onClick={() => setShowPersonalizationDialog(true)}
                    disabled={isGeneratingRecommendation}
                    className="relative bg-[#6A7FDB] hover:bg-[#5A6DCB] text-white px-6 py-3 rounded-lg"
                  >
                    {isGeneratingRecommendation ? (
                      <>
                        <span className="opacity-0">Get My Recommendation</span>
                        <span className="absolute inset-0 flex items-center justify-center">
                          Generating your recommendation...
                        </span>
                      </>
                    ) : (
                      <>Get My Recommendation</>
                    )}
                  </Button>
                </div>

                {/* AI Recommendation Result */}
                {aiRecommendation && (
                  <div className="animate-fade-in space-y-8">
                    {/* Summary Table */}
                    <Card>
                      <CardHeader className="bg-[#F7F7F8]">
                        <CardTitle className="text-xl">
                          Property Comparison Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Feature</TableHead>
                              <TableHead>Property A</TableHead>
                              <TableHead>Property B</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {aiRecommendation.summary_table.map((row, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">
                                  {row.field}
                                </TableCell>
                                <TableCell>{row.property_a}</TableCell>
                                <TableCell>{row.property_b}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Pros and Cons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Property A */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle>
                            {getPropertyData('property_a').property_name}
                          </CardTitle>
                          <CardDescription>Pros and Cons</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Pros */}
                          <div>
                            <h4 className="font-medium text-green-600 flex items-center gap-2 mb-2">
                              <ThumbsUp
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Pros
                            </h4>
                            <ul className="space-y-1 pl-6 list-disc">
                              {aiRecommendation.property_a_pros.map(
                                (pro, i) => (
                                  <li key={i}>{pro}</li>
                                )
                              )}
                            </ul>
                          </div>
                          {/* Cons */}
                          <div>
                            <h4 className="font-medium text-red-500 flex items-center gap-2 mb-2">
                              <ThumbsDown
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Cons
                            </h4>
                            <ul className="space-y-1 pl-6 list-disc">
                              {aiRecommendation.property_a_cons.map(
                                (con, i) => (
                                  <li key={i}>{con}</li>
                                )
                              )}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Property B */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle>
                            {getPropertyData('property_b').property_name}
                          </CardTitle>
                          <CardDescription>Pros and Cons</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Pros */}
                          <div>
                            <h4 className="font-medium text-green-600 flex items-center gap-2 mb-2">
                              <ThumbsUp
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Pros
                            </h4>
                            <ul className="space-y-1 pl-6 list-disc">
                              {aiRecommendation.property_b_pros.map(
                                (pro, i) => (
                                  <li key={i}>{pro}</li>
                                )
                              )}
                            </ul>
                          </div>
                          {/* Cons */}
                          <div>
                            <h4 className="font-medium text-red-500 flex items-center gap-2 mb-2">
                              <ThumbsDown
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Cons
                            </h4>
                            <ul className="space-y-1 pl-6 list-disc">
                              {aiRecommendation.property_b_cons.map(
                                (con, i) => (
                                  <li key={i}>{con}</li>
                                )
                              )}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Final Recommendation */}
                    <Card className="bg-[#E5DEFF] border-[#C2A9FF]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-[#6A7FDB]">
                          DuoHome's Recommendation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-800 whitespace-pre-line">
                          {aiRecommendation.final_recommendation}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Expert Section */}
                {comparisonResult && (
                  <div className="mt-8">
                    <ExpertSection
                      comparisonId={comparisonResult.comparison_id}
                      propertyAName={
                        getPropertyData('property_a').property_name ||
                        "Property A"
                      }
                      propertyBName={
                        getPropertyData('property_b').property_name ||
                        "Property B"
                      }
                    />
                  </div>
                )}

                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="bg-white"
                  >
                    Compare Different Properties
                  </Button>
                </div>
          </div>
        )}

        {/* Personalization Dialog - shown for any stage that has comparison results */}
        {(currentStage === 'metadata-review' || currentStage === 'full-comparison') && comparisonResult && (
          <Dialog
            open={showPersonalizationDialog}
            onOpenChange={setShowPersonalizationDialog}
          >
            <DialogContent className="sm:max-w-md max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tell us about your preferences</DialogTitle>
                <DialogDescription>
                  Help us personalize your property recommendation by answering a
                  few questions.
                </DialogDescription>
              </DialogHeader>
              <Form {...personalizationForm}>
                <form
                  onSubmit={personalizationForm.handleSubmit(
                    handleGetRecommendation
                  )}
                  className="space-y-6 py-4"
                >
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={personalizationForm.control}
                      name="has_pets"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Do you have pets?</FormLabel>
                          </div>
                          <FormControl>
                            <div className="flex items-center">
                              <button
                                type="button"
                                className={`px-3 py-1 rounded-l-md ${
                                  field.value
                                    ? "bg-[#6A7FDB] text-white"
                                    : "bg-gray-100"
                                }`}
                                onClick={() => field.onChange(true)}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                className={`px-3 py-1 rounded-r-md ${
                                  !field.value
                                    ? "bg-[#6A7FDB] text-white"
                                    : "bg-gray-100"
                                }`}
                                onClick={() => field.onChange(false)}
                              >
                                No
                              </button>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={personalizationForm.control}
                      name="works_from_home"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Do you work from home?</FormLabel>
                          </div>
                          <FormControl>
                            <div className="flex items-center">
                              <button
                                type="button"
                                className={`px-3 py-1 rounded-l-md ${
                                  field.value
                                    ? "bg-[#6A7FDB] text-white"
                                    : "bg-gray-100"
                                }`}
                                onClick={() => field.onChange(true)}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                className={`px-3 py-1 rounded-r-md ${
                                  !field.value
                                    ? "bg-[#6A7FDB] text-white"
                                    : "bg-gray-100"
                                }`}
                                onClick={() => field.onChange(false)}
                              >
                                No
                              </button>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Generate Recommendation</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Compare;
