
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpertList } from "@/components/admin/ExpertList";

const expertFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().optional(),
  company_website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  x_handle: z.string().optional(),
  instagram_url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  line_url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal(""))
});

type ExpertFormValues = z.infer<typeof expertFormSchema>;

export default function AdminExpertPanel() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const form = useForm<ExpertFormValues>({
    resolver: zodResolver(expertFormSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      phone: "",
      company_website: "",
      x_handle: "",
      instagram_url: "",
      line_url: ""
    }
  });

  // Check if user is admin, redirect if not
  React.useEffect(() => {
    if (!isAdmin && user) {
      toast({
        title: "Access denied",
        description: "You must be an admin to access this page.",
        variant: "destructive",
      });
      navigate("/");
    } else if (!user) {
      // Wait for auth to load before redirecting
      if (!isAdmin) {
        navigate("/auth");
      }
    }
  }, [isAdmin, user, navigate, toast]);

  // Handle profile image change
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    setProfileImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Create expert user and profile
  const onSubmit = async (data: ExpertFormValues) => {
    if (!user || !isAdmin) {
      toast({
        title: "Access denied",
        description: "You must be an admin to create expert profiles.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Create the expert user with admin API
      const { data: newExpert, error: createError } = await supabase.functions.invoke(
        "create-expert-user", 
        {
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            role: "expert"
          })
        }
      );
      
      if (createError || !newExpert?.id) {
        toast({
          title: "Error creating expert user",
          description: createError || "Failed to create expert user",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // 2. Upload profile image if present
      let profileImageUrl = null;
      
      if (profileImageFile) {
        const fileExt = profileImageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('expert-profiles')
          .upload(fileName, profileImageFile);
          
        if (uploadError) {
          console.error("Error uploading profile image:", uploadError);
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('expert-profiles')
            .getPublicUrl(fileName);
            
          profileImageUrl = publicUrl;
        }
      }
      
      // 3. Create expert profile
      const { error: profileError } = await supabase.from("expert_profiles").insert({
        user_id: newExpert.id,
        name: data.name,
        profile_image_url: profileImageUrl,
        email: data.email,
        phone: data.phone || null,
        company_website: data.company_website || null,
        x_handle: data.x_handle || null,
        instagram_url: data.instagram_url || null,
        line_url: data.line_url || null
      });
      
      if (profileError) {
        toast({
          title: "Error creating expert profile",
          description: profileError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Success
      toast({
        title: "Expert created successfully",
        description: `Created expert account for ${data.name}`,
      });
      
      // Reset form
      form.reset();
      setProfileImageFile(null);
      setProfileImagePreview(null);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      console.error("Error creating expert:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading or unauthorized state
  if (!user || !isAdmin) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>Checking permissions...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Expert Management</h1>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">Expert List</TabsTrigger>
          <TabsTrigger value="create">Create New Expert</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <ExpertList />
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Expert</CardTitle>
              <CardDescription>
                Create a new expert user account and profile. The expert will receive credentials via email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left column */}
                    <div className="space-y-6">
                      {/* Account details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Account Details</h3>
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input placeholder="expert@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Temporary Password *</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Minimum 6 characters" {...field} />
                              </FormControl>
                              <FormDescription>
                                The expert should change this after first login
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Basic profile info */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Profile Information</h3>
                        
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Smith" {...field} />
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
                                <Input placeholder="+81 90 1234 5678" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Profile Image Upload */}
                        <div className="space-y-2">
                          <FormLabel>Profile Image</FormLabel>
                          <div className="flex items-start space-x-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                              {profileImagePreview ? (
                                <img 
                                  src={profileImagePreview} 
                                  alt="Profile preview" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-400">No image</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <Input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                              <FormDescription className="mt-2">
                                Recommended size: 500x500 pixels
                              </FormDescription>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right column */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Web & Social Media</h3>
                      
                      <FormField
                        control={form.control}
                        name="company_website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" {...field} />
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
                              <Input placeholder="@username" {...field} />
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
                              <Input placeholder="https://instagram.com/username" {...field} />
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
                              <Input placeholder="https://line.me/ti/p/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-[#6A7FDB]" disabled={isLoading}>
                      {isLoading ? "Creating..." : "Create Expert Account"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
