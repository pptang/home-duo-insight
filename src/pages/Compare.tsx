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
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { RecommendationFeedback } from "@/components/RecommendationFeedback";

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
  recommendation_id?: string;
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
  // Lifestyle Fit (Day-to-Day Life)
  proximity_to_cafes: z.number().min(1).max(5).default(3),
  access_to_gym: z.number().min(1).max(5).default(3),
  dog_walking_friendly: z.number().min(1).max(5).default(3),
  quiet_at_night: z.number().min(1).max(5).default(3),
  morning_vs_afternoon_sunlight: z.enum(["morning", "afternoon", "no_preference"]).default("no_preference"),
  laundromat_access: z.number().min(1).max(5).default(3),
  
  // Emotional Desires / Aesthetic Preferences
  open_view: z.number().min(1).max(5).default(3),
  feels_like_home: z.number().min(1).max(5).default(3),
  creative_friendly: z.number().min(1).max(5).default(3),
  reading_corner_space: z.number().min(1).max(5).default(3),
  natural_surroundings: z.number().min(1).max(5).default(3),
  
  // Life Planning / Forward-looking Goals
  future_family_growth: z.number().min(1).max(5).default(3),
  work_from_home_support: z.number().min(1).max(5).default(3),
  resale_potential: z.number().min(1).max(5).default(3),
  renovation_willingness: z.number().min(1).max(5).default(3),
  storage_capacity: z.number().min(1).max(5).default(3),
  
  // Sensory or Comfort Needs
  natural_ventilation: z.number().min(1).max(5).default(3),
  light_sensitivity: z.number().min(1).max(5).default(3),
  minimalist_vs_maximalist: z.enum(["minimalist", "maximalist", "no_preference"]).default("no_preference"),
  privacy_from_neighbors: z.number().min(1).max(5).default(3),
  
  // Cultural / Routine-Based Needs
  grocery_chain_access: z.number().min(1).max(5).default(3),
  international_schools: z.number().min(1).max(5).default(3),
  weekend_market_access: z.number().min(1).max(5).default(3),
  safe_for_biking: z.number().min(1).max(5).default(3),
  spiritual_space_access: z.number().min(1).max(5).default(3),
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
  const { t } = useTranslation();
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
          title: t("compare.messages.retry_title"),
          description: t("compare.messages.error_retry"),
        });
        return;
      }

      toast({
        title: t("compare.messages.retry_started"),
        description: t("compare.messages.retry_started"),
      });
    } catch (error) {
      console.error('Retry image extraction error:', error);
      toast({
        variant: "destructive",
        title: t("compare.messages.error_title"),
        description: t("compare.messages.error_unexpected"),
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
              title: t("compare.messages.images_loaded"),
              description: t("compare.messages.success_images"),
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
      // Lifestyle Fit (Day-to-Day Life)
      proximity_to_cafes: 3,
      access_to_gym: 3,
      dog_walking_friendly: 3,
      quiet_at_night: 3,
      morning_vs_afternoon_sunlight: "no_preference",
      laundromat_access: 3,
      
      // Emotional Desires / Aesthetic Preferences
      open_view: 3,
      feels_like_home: 3,
      creative_friendly: 3,
      reading_corner_space: 3,
      natural_surroundings: 3,
      
      // Life Planning / Forward-looking Goals
      future_family_growth: 3,
      work_from_home_support: 3,
      resale_potential: 3,
      renovation_willingness: 3,
      storage_capacity: 3,
      
      // Sensory or Comfort Needs
      natural_ventilation: 3,
      light_sensitivity: 3,
      minimalist_vs_maximalist: "no_preference",
      privacy_from_neighbors: 3,
      
      // Cultural / Routine-Based Needs
      grocery_chain_access: 3,
      international_schools: 3,
      weekend_market_access: 3,
      safe_for_biking: 3,
      spiritual_space_access: 3,
    },
  });

  const handleAnalyzeProperties = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Show loading stages for better user feedback
      setLoadingStage(t("compare.url_input.loading_stage"));

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
          title: t("compare.messages.error_title"),
          description: t("compare.messages.error_extract"),
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
      if (data?.comparison_id) {
        trackComparisonCreated(data.comparison_id);
      }
      toast({
        title: t("compare.messages.success_title"),
        description: t("compare.messages.success_analyze"),
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        variant: "destructive",
        title: t("compare.messages.error_title"),
        description: t("compare.messages.error_unexpected"),
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
      // Organize preferences by category for better AI processing
      const categorizedPreferences = {
        lifestyle_fit: {
          proximity_to_cafes: values.proximity_to_cafes,
          access_to_gym: values.access_to_gym,
          dog_walking_friendly: values.dog_walking_friendly,
          quiet_at_night: values.quiet_at_night,
          morning_vs_afternoon_sunlight: values.morning_vs_afternoon_sunlight,
          laundromat_access: values.laundromat_access,
        },
        emotional_desires: {
          open_view: values.open_view,
          feels_like_home: values.feels_like_home,
          creative_friendly: values.creative_friendly,
          reading_corner_space: values.reading_corner_space,
          natural_surroundings: values.natural_surroundings,
        },
        life_planning: {
          future_family_growth: values.future_family_growth,
          work_from_home_support: values.work_from_home_support,
          resale_potential: values.resale_potential,
          renovation_willingness: values.renovation_willingness,
          storage_capacity: values.storage_capacity,
        },
        sensory_comfort: {
          natural_ventilation: values.natural_ventilation,
          light_sensitivity: values.light_sensitivity,
          minimalist_vs_maximalist: values.minimalist_vs_maximalist,
          privacy_from_neighbors: values.privacy_from_neighbors,
        },
        cultural_routine: {
          grocery_chain_access: values.grocery_chain_access,
          international_schools: values.international_schools,
          weekend_market_access: values.weekend_market_access,
          safe_for_biking: values.safe_for_biking,
          spiritual_space_access: values.spiritual_space_access,
        }
      };

      // Normalize language to 'en' or 'ja' (strip locale variants like 'en-US', 'ja-JP')
      const detectedLanguage = i18n.language || 'en';
      const normalizedLanguage: 'en' | 'ja' = detectedLanguage.startsWith('ja') ? 'ja' : 'en';
      console.log('Language detection:', { detectedLanguage, normalizedLanguage });

      const { data, error } = await supabase.functions.invoke(
        "generate-recommendation",
        {
          body: {
            comparison_id: comparisonResult.comparison_id,
            property_a: comparisonResult.property_a,
            property_b: comparisonResult.property_b,
            user_profile: categorizedPreferences,
            user_id: user?.id || null, // Include user_id if logged in
            language: normalizedLanguage, // Add normalized language
          },
        }
      );

      if (error) {
        console.error("Recommendation error:", error);
        toast({
          variant: "destructive",
          title: t("compare.messages.error_title"),
          description: t("compare.messages.error_recommendation"),
        });
        return;
      }

      // Success - set AI recommendation
      setAiRecommendation(data);
      trackRecommendationGenerated(
        comparisonResult.comparison_id,
        data?.recommendation_id,
        normalizedLanguage,
      );
      toast({
        title: t("compare.messages.success_title"),
        description: t("compare.messages.success_recommendation"),
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        variant: "destructive",
        title: t("compare.messages.error_title"),
        description: t("compare.messages.error_unexpected"),
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
              {t("compare.hero.title")}
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            {t("compare.hero.subtitle")}
          </p>

          {/* Dynamic Step Progress */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-4 md:space-x-8">
              <div className={`flex items-center space-x-2 transition-all duration-500 ${currentStage === 'url-input' ? 'scale-110 text-accent' : 'text-white/70'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${currentStage === 'url-input' ? 'bg-accent text-primary animate-pulse' : 'bg-white/20'}`}>
                  1
                </div>
                <span className="hidden md:block font-medium">{t("compare.hero.step1")}</span>
              </div>

              <div className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full bg-accent transition-all duration-700 ${currentStage !== 'url-input' ? 'w-full' : 'w-0'}`}></div>
              </div>

              <div className={`flex items-center space-x-2 transition-all duration-500 ${currentStage === 'metadata-review' ? 'scale-110 text-accent' : currentStage === 'full-comparison' ? 'text-white' : 'text-white/50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${currentStage === 'metadata-review' ? 'bg-accent text-primary animate-pulse' : currentStage === 'full-comparison' ? 'bg-white/20' : 'bg-white/10'}`}>
                  2
                </div>
                <span className="hidden md:block font-medium">{t("compare.hero.step2")}</span>
              </div>

              <div className="w-8 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full bg-accent transition-all duration-700 ${currentStage === 'full-comparison' ? 'w-full' : 'w-0'}`}></div>
              </div>

              <div className={`flex items-center space-x-2 transition-all duration-500 ${currentStage === 'full-comparison' ? 'scale-110 text-accent' : 'text-white/50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${currentStage === 'full-comparison' ? 'bg-accent text-primary animate-pulse' : 'bg-white/10'}`}>
                  3
                </div>
                <span className="hidden md:block font-medium">{t("compare.hero.step3")}</span>
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

interface CompareContentProps {
  currentStage: 'url-input' | 'metadata-review' | 'full-comparison';
  setCurrentStage: React.Dispatch<React.SetStateAction<'url-input' | 'metadata-review' | 'full-comparison'>>;
  comparisonResult: ComparisonResult | null;
  aiRecommendation: AIRecommendation | null;
  isLoading: boolean;
  loadingStage: string;
  form: ReturnType<typeof useForm<FormValues>>;
  handleAnalyzeProperties: (values: FormValues) => Promise<void>;
  resetForm: () => void;
  showPersonalizationDialog: boolean;
  setShowPersonalizationDialog: (show: boolean) => void;
  personalizationForm: ReturnType<typeof useForm<PersonalizationValues>>;
  handleGetRecommendation: (values: PersonalizationValues) => Promise<void>;
  isGeneratingRecommendation: boolean;
  handleRetryImageExtraction: (comparisonId: string) => Promise<void>;
}

const CompareContent: React.FC<CompareContentProps> = ({
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
  const { t } = useTranslation();
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
    if (!age) return t("compare.property_details.na");
    return `${Math.floor(age)} ${t("compare.property_details.years_old")}`;
  };

  const formatConstructionDate = (year?: number, month?: number): string => {
    if (!year) return t("compare.property_details.na");
    if (!month) return `${t("compare.property_details.built_in")} ${year}`;
    return `${t("compare.property_details.built_in")} ${year}年${month}月`;
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-4xl mx-auto">

        {currentStage === 'url-input' && (
              <div className="section-fade animate-in bg-card rounded-2xl shadow-xl p-8 md:p-10 border border-border">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4 micro-animation">🏡</div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {t("compare.url_input.title")}
                  </h2>
                  <p className="text-muted-foreground">
                    {t("compare.url_input.subtitle")}
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
                              {t("compare.url_input.property_a_label")}
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder={t("compare.url_input.placeholder_a")}
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
                              {t("compare.url_input.property_b_label")}
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder={t("compare.url_input.placeholder_b")}
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
                              {loadingStage || t("compare.url_input.analyzing")}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{t("compare.url_input.analyze_button")}</span>
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
                      <p className="text-primary font-medium">
                        {formatPrice(getPropertyData('property_a').price_yen)}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.address")}:</span>
                          <span className="font-medium text-right">
                            {getPropertyData('property_a').address}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.floor_plan")}:</span>
                          <span className="font-medium">
                            {getPropertyData('property_a').floor_plan}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.private_area")}:</span>
                          <span className="font-medium">
                            {formatArea(getPropertyData('property_a').private_area_sqm)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.commute_time")}:</span>
                          <span className="font-medium">
                            {getPropertyData('property_a').commute_minutes ?
                              `${getPropertyData('property_a').commute_minutes} ${t("compare.property_details.minutes")}` :
                              t("compare.property_details.na")
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.building_age")}:</span>
                          <span className="font-medium">
                            {formatBuildingAge(getPropertyData('property_a').building_age_years)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.construction")}:</span>
                          <span className="font-medium">
                            {formatConstructionDate(
                              getPropertyData('property_a').construction_year,
                              getPropertyData('property_a').construction_month
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.property_type")}:</span>
                          <span className="font-medium">
                            {getPropertyData('property_a').property_type}
                          </span>
                        </div>
                        {comparisonResult.property_a.notes && (
                          <div className="mt-2">
                            <span className="text-gray-600 block">{t("compare.property_details.notes")}:</span>
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
                      <p className="text-primary font-medium">
                        {formatPrice(getPropertyData('property_b').price_yen)}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.address")}:</span>
                          <span className="font-medium text-right">
                            {getPropertyData('property_b').address}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.floor_plan")}:</span>
                          <span className="font-medium">
                            {getPropertyData('property_b').floor_plan}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.private_area")}:</span>
                          <span className="font-medium">
                            {formatArea(getPropertyData('property_b').private_area_sqm)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.commute_time")}:</span>
                          <span className="font-medium">
                            {getPropertyData('property_b').commute_minutes ?
                              `${getPropertyData('property_b').commute_minutes} ${t("compare.property_details.minutes")}` :
                              t("compare.property_details.na")
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.building_age")}:</span>
                          <span className="font-medium">
                            {formatBuildingAge(getPropertyData('property_b').building_age_years)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.construction")}:</span>
                          <span className="font-medium">
                            {formatConstructionDate(
                              getPropertyData('property_b').construction_year,
                              getPropertyData('property_b').construction_month
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("compare.property_details.property_type")}:</span>
                          <span className="font-medium">
                            {getPropertyData('property_b').property_type}
                          </span>
                        </div>
                        {comparisonResult.property_b.notes && (
                          <div className="mt-2">
                            <span className="text-gray-600 block">{t("compare.property_details.notes")}:</span>
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
                    className="relative bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg"
                  >
                    {isGeneratingRecommendation ? (
                      <>
                        <span className="opacity-0">{t("compare.recommendation.get_recommendation")}</span>
                        <span className="absolute inset-0 flex items-center justify-center">
                          {t("compare.recommendation.generating")}...
                        </span>
                      </>
                    ) : (
                      <>{t("compare.recommendation.get_recommendation")}</>
                    )}
                  </Button>
                </div>

                {/* AI Recommendation Result */}
                {aiRecommendation && (
                  <div className="animate-fade-in space-y-8">
                    {/* Summary Table */}
                    <Card>
                      <CardHeader className="bg-muted">
                        <CardTitle className="text-xl">
                          {t("compare.recommendation.summary_title")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("compare.recommendation.summary_feature")}</TableHead>
                              <TableHead>{t("compare.recommendation.summary_property_a")}</TableHead>
                              <TableHead>{t("compare.recommendation.summary_property_b")}</TableHead>
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
                          <CardDescription>{t("compare.recommendation.pros_cons")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Pros */}
                          <div>
                            <h4 className="font-medium text-green-600 flex items-center gap-2 mb-2">
                              <ThumbsUp
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              {t("compare.recommendation.pros")}
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
                              {t("compare.recommendation.cons")}
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
                          <CardDescription>{t("compare.recommendation.pros_cons")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Pros */}
                          <div>
                            <h4 className="font-medium text-green-600 flex items-center gap-2 mb-2">
                              <ThumbsUp
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              {t("compare.recommendation.pros")}
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
                              {t("compare.recommendation.cons")}
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
                    <Card className="bg-accent/20 border-accent">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl text-primary">
                          {t("compare.recommendation.title")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-800 whitespace-pre-line">
                          {aiRecommendation.final_recommendation}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Recommendation Feedback */}
                    {aiRecommendation.recommendation_id && (
                      <RecommendationFeedback
                        recommendationId={aiRecommendation.recommendation_id}
                      />
                    )}
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
                    {t("compare.recommendation.compare_different")}
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
                <DialogTitle>{t("compare.personalization.title")}</DialogTitle>
                <DialogDescription>
                  {t("compare.personalization.subtitle")}
                </DialogDescription>
              </DialogHeader>
              <Form {...personalizationForm}>
                <form
                  onSubmit={personalizationForm.handleSubmit(
                    handleGetRecommendation
                  )}
                  className="space-y-6 py-4"
                >
                  <div className="space-y-6">
                    {/* Lifestyle Fit (Day-to-Day Life) */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {t("compare.personalization.lifestyle_fit.title")}
                      </h3>
                      
                      <FormField
                        control={personalizationForm.control}
                        name="proximity_to_cafes"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.lifestyle_fit.proximity_to_cafes")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="access_to_gym"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.lifestyle_fit.access_to_gym")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="dog_walking_friendly"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.lifestyle_fit.dog_walking_friendly")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="quiet_at_night"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.lifestyle_fit.quiet_at_night")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="morning_vs_afternoon_sunlight"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.lifestyle_fit.morning_vs_afternoon_sunlight")}
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("compare.personalization.select_preference")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                    <SelectItem value="morning">{t("compare.personalization.lifestyle_fit.morning_sunlight")}</SelectItem>
                                <SelectItem value="afternoon">{t("compare.personalization.lifestyle_fit.afternoon_sunlight")}</SelectItem>
                                <SelectItem value="no_preference">{t("compare.personalization.lifestyle_fit.no_preference")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="laundromat_access"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.lifestyle_fit.laundromat_access")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Emotional Desires / Aesthetic Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {t("compare.personalization.emotional_desires.title")}
                      </h3>
                      
                      <FormField
                        control={personalizationForm.control}
                        name="open_view"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.emotional_desires.open_view")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="feels_like_home"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.emotional_desires.feels_like_home")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="creative_friendly"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.emotional_desires.creative_friendly")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="reading_corner_space"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.emotional_desires.reading_corner_space")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="natural_surroundings"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.emotional_desires.natural_surroundings")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Life Planning / Forward-looking Goals */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {t("compare.personalization.life_planning.title")}
                      </h3>
                      
                      <FormField
                        control={personalizationForm.control}
                        name="future_family_growth"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.life_planning.future_family_growth")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="work_from_home_support"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.life_planning.work_from_home_support")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="resale_potential"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.life_planning.resale_potential")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="renovation_willingness"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.life_planning.renovation_willingness")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="storage_capacity"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.life_planning.storage_capacity")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Sensory or Comfort Needs */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {t("compare.personalization.sensory_comfort.title")}
                      </h3>
                      
                      <FormField
                        control={personalizationForm.control}
                        name="natural_ventilation"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.sensory_comfort.natural_ventilation")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="light_sensitivity"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.sensory_comfort.light_sensitivity")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="minimalist_vs_maximalist"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.sensory_comfort.minimalist_vs_maximalist")}
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("compare.personalization.select_preference")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="minimalist">{t("compare.personalization.sensory_comfort.minimalist")}</SelectItem>
                                <SelectItem value="maximalist">{t("compare.personalization.sensory_comfort.maximalist")}</SelectItem>
                                <SelectItem value="no_preference">{t("compare.personalization.no_preference")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="privacy_from_neighbors"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.sensory_comfort.privacy_from_neighbors")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Cultural / Routine-Based Needs */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {t("compare.personalization.cultural_routine.title")}
                      </h3>
                      
                      <FormField
                        control={personalizationForm.control}
                        name="grocery_chain_access"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.cultural_routine.grocery_chain_access")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="international_schools"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.cultural_routine.international_schools")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="weekend_market_access"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.cultural_routine.weekend_market_access")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="safe_for_biking"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.cultural_routine.safe_for_biking")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalizationForm.control}
                        name="spiritual_space_access"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              {t("compare.personalization.cultural_routine.spiritual_space_access")}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{t("compare.personalization.not_important")}</span>
                              <span>{t("compare.personalization.very_important")}</span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">{t("compare.personalization.submit")}</Button>
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
