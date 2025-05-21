
# Expert Profile Page

## Overview
The Expert Profile Page provides a public-facing view of real estate experts registered on DuoHome Advisor. It's accessible to all users, whether logged in or not. Experts can edit their own profiles when viewing their own profile page.

## Route
- Path: `/experts/:expertId`
- Parameter: `expertId` - The user ID of the expert profile to display

## Implementation Details

### Data Fetching
The page uses two primary data fetches:
1. ExpertProfile component fetches the expert's profile information using the `expertId` parameter:
   ```typescript
   const { data, error } = await supabase
     .from("expert_profiles")
     .select("*")
     .eq("user_id", expertId)
     .single();
   ```

2. ExpertProfilePage component fetches activity metrics (like vote count):
   ```typescript
   const { count, error } = await supabase
     .from("votes")
     .select("*", { count: "exact", head: true })
     .eq("expert_user_id", expertId);
   ```

### Components
- **ExpertProfile**: Displays the expert's personal information, contact details, and ratings
- **ExpertProfileEditForm**: Allows experts to edit their own profile information
- **Activity Summary Card**: Shows the expert's contribution metrics on the platform

### Image Handling
- Profile images are stored in the `expert-profiles` bucket in Supabase Storage
- Images are uploaded with a path format: `experts/{expertId}/{timestamp}.{extension}`
- Public URLs are saved to `ExpertProfiles.profile_image_url`
- Image constraints:
  - Maximum size: 5MB
  - Supported formats: PNG, JPG/JPEG, WEBP
  - Recommended dimensions: 500x500 pixels

### Rating Logic
- Ratings are displayed as stars using the expert's average_rating field
- Total number of ratings is shown using the rating_count field
- The ExpertRating component is imported but set to read-only for public viewing

### Edit Mode
- The page includes role-based checks to determine if the viewer is the profile owner
- Only profile owners see an "Edit Profile" button
- Edit mode allows updating:
  - Profile image
  - Name, Email, Phone
  - Bio/Description
  - Website and social media links
- Form validation enforces required fields and format constraints
- Successful updates are immediately reflected in the UI

### Contact CTA
- The "Contact Expert" button links to the expert's email using a mailto: link
- Future enhancement: Add in-app messaging functionality

## Styling

The page follows DuoHome visual style:
- Font: Inter
- Primary Color: #6A7FDB (calm blue)
- Accent: #C2A9FF (soothing lavender)
- Background: #FFFFFF and #F7F7F8
- Card-based layout with generous spacing
- Lucide icons for visual enhancement

## Potential Future Enhancements

1. Add more detailed activity metrics:
   - Recent comparisons voted on
   - Areas of specialization based on voting patterns

2. Expand profile customization:
   - Add more specialized fields
   - Allow adding certifications or credentials

3. Implement in-app messaging instead of email contact

4. Add expert availability calendar or scheduling functionality
