
# Comparison Feed Card

## Overview

The Comparison Feed Card displays property comparisons with expert voting information and proper author attribution. Each card now displays the actual author's name fetched from the profiles table.

## Components

- **Feed.tsx**: Main component that fetches and displays comparison cards with author information
- **ExpertAvatarGroup.tsx**: Reusable component that displays a group of expert avatars with tooltips and "more" indicator

## Data Fetching

### Author Information

The Feed component fetches comparisons along with author profile data using a nested Supabase query:

```typescript
const { data: comparisonsData } = await supabase
  .from("comparisons")
  .select(`
    *,
    propertyA:property_a_id(id, property_name, price_yen, floor_plan, image_urls, property_type),
    propertyB:property_b_id(id, property_name, price_yen, floor_plan, image_urls, property_type),
    profiles:user_id(id, full_name, avatar_url)
  `)
  .order("created_at", { ascending: false });
```

This joins the comparisons table with:
- Properties (for property details)
- Profiles table (for author name and avatar)

### Expert Information

Expert data is fetched separately for each comparison:

```typescript
const { data: votesData } = await supabase
  .from("votes")
  .select(`
    id, 
    expert_user_id,
    voted_for,
    expert_profiles!inner(
      id,
      name,
      profile_image_url
    )
  `)
  .eq("comparison_id", comparison.id);
```

## Author Name Display

### Data Extraction
```typescript
const authorProfile = comparison.profiles && typeof comparison.profiles === 'object' 
  ? comparison.profiles as { id: string; full_name: string | null; avatar_url: string | null }
  : null;

const userName = authorProfile?.full_name || "Anonymous User";
const userAvatar = authorProfile?.avatar_url || undefined;
```

### Fallback Logic
- **Primary**: Display `profiles.full_name` if available
- **Fallback**: Show "Anonymous User" if:
  - No profile is linked to the comparison
  - Profile exists but `full_name` is null/empty
  - Join query fails

### Avatar Display
- Shows profile avatar if available
- Falls back to colored circle with user's first initial
- Uses "U" if no name is available

## User Interface

- Author information appears at the top of each comparison card
- Shows author name and creation date
- Avatar is displayed next to the name
- Maintains consistent styling with existing design system

## Error Handling

- Gracefully handles missing profile data
- Uses fallback display for anonymous users
- Continues to function if profile joins fail
- Logs errors for debugging without breaking the UI

## Security Considerations

- Only displays public profile information
- Respects user privacy settings
- No sensitive data is exposed in the feed
