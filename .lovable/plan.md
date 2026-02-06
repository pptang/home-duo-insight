

## Recommendation Feedback Feature (Thumbs Up/Down)

### Overview
Add a user feedback system that allows users to rate AI recommendations as helpful or not helpful using thumbs-up/thumbs-down buttons. This feedback will be stored in the database for analysis of recommendation quality.

### Implementation Details

#### 1. Database Changes
Create a new table `recommendation_feedback` to store user feedback:

```text
Table: recommendation_feedback
- id (uuid, primary key)
- recommendation_id (uuid, foreign key to recommendations.id)
- user_id (uuid, nullable - for logged-in users)
- session_id (text - for anonymous users tracking)
- feedback (text - 'positive' or 'negative')
- created_at (timestamp)
```

Row-Level Security (RLS) policies:
- Anyone can INSERT feedback (to allow anonymous feedback)
- Anyone can SELECT feedback (for display purposes)
- Users can UPDATE their own feedback (to change their vote)

#### 2. New Component
Create `RecommendationFeedback.tsx` component that:
- Displays two buttons (thumbs-up and thumbs-down)
- Shows a "thank you" message after feedback is submitted
- Tracks feedback via session ID for anonymous users
- Prevents duplicate submissions using localStorage

#### 3. UI Integration
Add the feedback component in two locations:
- **Compare.tsx**: Below the Final Recommendation card (after line 1113)
- **ComparisonDetail.tsx**: Below the Final Recommendation card (after line 644)

#### 4. Localization
Add new translation keys for English and Japanese:

```text
recommendation.feedback.title: "Was this helpful?"
recommendation.feedback.thanks: "Thank you for your feedback!"
recommendation.feedback.thumbs_up: "Yes, helpful"
recommendation.feedback.thumbs_down: "Not helpful"
```

---

### Technical Approach

**Session Tracking for Anonymous Users:**
- Generate a unique session ID stored in localStorage
- This allows tracking feedback even from non-logged-in users
- Prevents the same user from submitting multiple feedbacks

**State Management:**
- Use local state to track if feedback was submitted
- Check localStorage on component mount to restore previous feedback state
- Store both the feedback type and recommendation ID

**Database Query Example:**
```sql
INSERT INTO recommendation_feedback (recommendation_id, user_id, session_id, feedback)
VALUES ($1, $2, $3, $4);
```

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/RecommendationFeedback.tsx` | Create new component |
| `src/pages/Compare.tsx` | Add feedback component after recommendation |
| `src/pages/ComparisonDetail.tsx` | Add feedback component after recommendation |
| `src/locales/en/translation.json` | Add feedback translation keys |
| `src/locales/ja/translation.json` | Add feedback translation keys |
| Database migration | Create `recommendation_feedback` table with RLS |

---

### Visual Design
The feedback UI will appear as a subtle, centered section below the recommendation:

```text
+--------------------------------------------------+
|              Was this helpful?                    |
|                                                  |
|     [ 👍 Yes, helpful ]    [ 👎 Not helpful ]     |
|                                                  |
+--------------------------------------------------+
```

After submission:
```text
+--------------------------------------------------+
|         Thank you for your feedback! 🙏          |
+--------------------------------------------------+
```

---

### Analytics Potential
Once implemented, you can query the feedback data to analyze:
- Overall satisfaction rate (% positive feedback)
- Trends over time
- Correlation with specific property types or price ranges

