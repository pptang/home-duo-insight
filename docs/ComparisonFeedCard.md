# Comparison Feed Card

## Overview

The Comparison Feed Card displays property comparisons with expert voting information. It now includes expert avatars that link to their respective profile pages.

## Components

- **Feed.tsx**: Main component that fetches and displays comparison cards
- **ExpertAvatarGroup.tsx**: Reusable component that displays a group of expert avatars with tooltips and "more" indicator

## Data Fetching

The Feed component fetches comparisons along with expert data using a nested Supabase query:

```typescript
const { data: votesData } = await supabase
  .from("votes")
  .select(
    `
    id, 
    expert_user_id,
    voted_for,
    expert:expert_user_id(
      id,
      profiles:profiles(
        avatar_url,
        full_name
      )
    )
  `
  )
  .eq("comparison_id", comparison.id);
```

This joins the votes table with expert profiles to get:

- Expert user ID
- Expert name (from profiles.full_name)
- Profile image URL (from profiles.avatar_url)

## Avatar Rendering

Avatars are rendered using the ExpertAvatarGroup component which:

1. Takes an array of expert objects with user_id, name, and profile_image_url
2. Displays up to a specified number of avatars (default: 5)
3. Shows a "+X more" indicator if there are additional experts
4. Provides tooltips showing expert names on hover
5. Makes each avatar a clickable link to the expert's profile page

## Accessibility Features

- Each avatar has an appropriate aria-label
- Tooltips are accessible via keyboard focus
- Fallback avatars show expert initials when no image is available

## User Interface

- Avatars appear in a horizontal row with slight overlap
- Each avatar has a white border for visual separation
- Hover effects provide feedback before clicking
- Tooltips display expert names on hover/focus

## Error Handling

- Gracefully handles missing expert profiles
- Uses fallback initials when profile images are not available
- Skips rendering if no experts have voted
