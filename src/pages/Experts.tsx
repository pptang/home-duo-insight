import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, Clock, Users, Star } from "lucide-react";

const JAPANESE_PREFECTURES = [
  "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", 
  "埼玉", "千葉", "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野",
  "岐阜", "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山",
  "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡",
  "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"
];

const SPECIALIZATION_TAGS = [
  "新築", "中古", "賃貸", "売買", "投資物件", "一戸建て", "マンション", "土地", 
  "商業物件", "リノベーション", "住宅ローン", "査定", "相続", "税務"
];

const Experts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    company_website: "",
    x_handle: "",
    instagram_url: "",
    line_url: "",
    bio: "",
    region: "",
  });

  useEffect(() => {
    if (user) {
      checkExistingApplication();
    }
  }, [user]);

  const checkExistingApplication = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("expert_profiles")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error checking application:", error);
      return;
    }

    if (data) {
      setHasApplication(true);
      setApplicationStatus(data.status);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPG, PNG, or WEBP image",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      let profileImageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('expert-profiles')
          .upload(fileName, imageFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('expert-profiles')
          .getPublicUrl(fileName);

        profileImageUrl = publicUrl;
      }

      // Insert expert profile application  
      const { error } = await supabase
        .from("expert_profiles")
        .insert({
          id: user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company_website: formData.company_website || null,
          x_handle: formData.x_handle || null,
          instagram_url: formData.instagram_url || null,
          line_url: formData.line_url || null,
          bio: formData.bio,
          region: formData.region,
          profile_image_url: profileImageUrl,
          specialization_tags: selectedTags,
          status: "pending"
        } as any);

      if (error) {
        throw error;
      }

      toast({
        title: "Application submitted!",
        description: "Your expert application has been submitted for review.",
      });

      setIsModalOpen(false);
      setHasApplication(true);
      setApplicationStatus("pending");

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 to-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join as an Expert</CardTitle>
            <CardDescription>
              Please sign in to apply as an expert on AiSumai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/auth">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Users className="h-12 w-12 text-primary mr-4" />
              <h1 className="text-4xl font-bold text-foreground">Expert Network</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our community of real estate professionals and help people make better housing decisions across Japan.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Star className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">500+</div>
                <p className="text-muted-foreground">Expert Reviews</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">50+</div>
                <p className="text-muted-foreground">Active Experts</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <CheckCircle className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">1000+</div>
                <p className="text-muted-foreground">Helped Decisions</p>
              </CardContent>
            </Card>
          </div>

          {/* Application Section */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Become an AiSumai Expert</CardTitle>
              <CardDescription>
                Share your expertise and help people find their perfect home
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {hasApplication ? (
                <div className="space-y-4">
                  {applicationStatus === "pending" && (
                    <div className="flex items-center justify-center space-x-2 text-accent">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Your application is under review</span>
                    </div>
                  )}
                  {applicationStatus === "approved" && (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Welcome to the expert network!</span>
                    </div>
                  )}
                  {applicationStatus === "rejected" && (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">Your previous application was not approved.</p>
                      <Button onClick={() => setHasApplication(false)}>
                        Apply Again
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">What you'll do as an expert:</h3>
                    <ul className="text-left space-y-2 max-w-md mx-auto">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Review property comparisons and provide professional insights</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Share your local market knowledge and expertise</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Build your professional profile and connect with clients</span>
                      </li>
                    </ul>
                  </div>

                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="px-8">
                        Apply to Become an Expert
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Expert Application</DialogTitle>
                        <DialogDescription>
                          Please provide your professional information to join our expert network.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Image */}
                        <div className="space-y-2">
                          <Label htmlFor="image">Profile Image *</Label>
                          <div className="flex items-center space-x-4">
                            {previewUrl && (
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="h-20 w-20 rounded-full object-cover border"
                              />
                            )}
                            <div className="flex-1">
                              <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                required={!previewUrl}
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                JPG, PNG, or WEBP. Max 5MB.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="region">Region *</Label>
                            <Select value={formData.region} onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select prefecture" />
                              </SelectTrigger>
                              <SelectContent>
                                {JAPANESE_PREFECTURES.map(prefecture => (
                                  <SelectItem key={prefecture} value={prefecture}>
                                    {prefecture}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Professional Information */}
                        <div className="space-y-2">
                          <Label htmlFor="company_website">Company Website</Label>
                          <Input
                            id="company_website"
                            type="url"
                            value={formData.company_website}
                            onChange={(e) => setFormData(prev => ({ ...prev, company_website: e.target.value }))}
                            placeholder="https://your-company.com"
                          />
                        </div>

                        {/* Social Media */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="x_handle">X (Twitter) Handle</Label>
                            <Input
                              id="x_handle"
                              value={formData.x_handle}
                              onChange={(e) => setFormData(prev => ({ ...prev, x_handle: e.target.value }))}
                              placeholder="@username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="instagram_url">Instagram URL</Label>
                            <Input
                              id="instagram_url"
                              value={formData.instagram_url}
                              onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                              placeholder="https://instagram.com/username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="line_url">LINE Profile URL</Label>
                            <Input
                              id="line_url"
                              value={formData.line_url}
                              onChange={(e) => setFormData(prev => ({ ...prev, line_url: e.target.value }))}
                              placeholder="https://line.me/ti/p/username"
                            />
                          </div>
                        </div>

                        {/* Specialization */}
                        <div className="space-y-2">
                          <Label>Specialization Tags *</Label>
                          <p className="text-sm text-muted-foreground">Select all that apply</p>
                          <div className="flex flex-wrap gap-2">
                            {SPECIALIZATION_TAGS.map(tag => (
                              <Badge
                                key={tag}
                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => toggleTag(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          {selectedTags.length === 0 && (
                            <p className="text-sm text-destructive">Please select at least one specialization</p>
                          )}
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                          <Label htmlFor="bio">Professional Bio *</Label>
                          <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            rows={4}
                            placeholder="Tell us about your background, experience, and what makes you a great real estate expert..."
                            required
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={isLoading || selectedTags.length === 0}
                          >
                            {isLoading ? "Submitting..." : "Submit Application"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Experts;