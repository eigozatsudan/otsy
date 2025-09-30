# Non-Intrusive Advertising System

This module implements a privacy-first advertising system for the Otsukai DX platform, designed to generate revenue while maintaining an excellent user experience and respecting user privacy.

## 🎯 Privacy-First Principles

### ✅ What We Track (Minimal Data)
- **Ad impressions** - When ads are shown (with optional user/group context)
- **Ad slot placement** - Where ads are displayed (list_top, detail_bottom)
- **Creative performance** - Which ads perform best (aggregated data only)

### ❌ What We DON'T Track
- ❌ Cross-site tracking or cookies
- ❌ Detailed user profiling or behavioral analysis
- ❌ Personal information in ad targeting
- ❌ Location-based ad targeting
- ❌ Purchase history for ad targeting
- ❌ Social media integration for ads

## 🚀 Features

### Core Advertising Features
- **Two Ad Slots Only** - `list_top` and `detail_bottom` placements
- **One-Ad-Per-Screen Rule** - Never more than one ad visible at a time
- **Frequency Control** - Prevents ad fatigue with cooldown periods
- **Priority-Based Selection** - Weighted ad selection algorithm
- **Daily Impression Limits** - Respects user experience with reasonable limits
- **Anonymous Ad Serving** - Works without user authentication

### Privacy Features
- **Optional User Tracking** - Impression logging works with or without user ID
- **Minimal Data Collection** - Only essential metrics for ad performance
- **No Cross-Site Tracking** - Ads are served from the same domain
- **User Reporting** - Users can report inappropriate ad content
- **Transparent Metrics** - Clear statistics without personal data exposure

### Administrative Features
- **Ad Creative Management** - Create, update, and manage ad content
- **Performance Analytics** - Aggregated statistics and reporting
- **Content Moderation** - Review and manage reported ads
- **Priority Control** - Weighted ad selection based on priority (1-10)
- **Status Management** - Active, paused, and expired ad states

## 📡 API Endpoints

### Public Endpoints (No Authentication Required)
```
GET    /ads/display/:slot              # Get ad for display
POST   /ads/impression                 # Log ad impression
POST   /ads/report                     # Report inappropriate content (auth required)
```

### Admin Endpoints (Admin Authentication Required)
```
POST   /ads/creatives                  # Create ad creative
GET    /ads/creatives                  # List all ad creatives
GET    /ads/creatives/:id              # Get specific ad creative
PUT    /ads/creatives/:id              # Update ad creative
DELETE /ads/creatives/:id              # Delete ad creative
GET    /ads/stats                      # Get advertising statistics
```

## 🔧 Usage Examples

### Getting an Ad for Display

```typescript
// Get ad for shopping list top
GET /ads/display/list_top?group_id=group123

Response:
{
  "creative_id": "ad-uuid",
  "title": "Fresh Organic Vegetables",
  "description": "Get 20% off on all organic vegetables this week!",
  "image_url": "https://example.com/ad-image.jpg",
  "click_url": "https://example.com/vegetables",
  "slot": "list_top"
}

// No ad available
Response: 204 No Content
```

### Logging an Ad Impression

```typescript
POST /ads/impression
{
  "creative_id": "ad-uuid",
  "slot": "list_top",
  "group_id": "group123"  // optional
}

Response:
{
  "success": true
}
```

### Creating an Ad Creative (Admin)

```typescript
POST /ads/creatives
Authorization: Bearer <admin_token>
{
  "title": "Fresh Organic Vegetables",
  "description": "Get 20% off on all organic vegetables this week!",
  "image_url": "https://example.com/ad-image.jpg",
  "click_url": "https://example.com/vegetables",
  "slot": "list_top",
  "priority": 7
}
```

### Reporting Inappropriate Content

```typescript
POST /ads/report
Authorization: Bearer <user_token>
{
  "creative_id": "ad-uuid",
  "reason": "Inappropriate content",
  "details": "Contains offensive material"
}
```

## 🎨 Ad Slot Specifications

### List Top Slot (`list_top`)
- **Placement**: Top of shopping lists
- **Format**: Native ad card matching list design
- **Frequency**: Maximum 1 per list view
- **Design**: Integrates seamlessly with shopping list items

### Detail Bottom Slot (`detail_bottom`)
- **Placement**: Bottom of item details and purchase modals
- **Format**: Banner advertisement
- **Frequency**: Maximum 1 per modal/detail view
- **Design**: Clear separation from content with subtle styling

## 📊 Frequency Control Algorithm

### Daily Limits
- **Maximum 50 impressions per user per day**
- **5-minute cooldown between same ad impressions**
- **Priority-based selection with weighted randomization**

### Selection Logic
1. Filter active ads for the requested slot
2. Check user's daily impression limit (if authenticated)
3. Remove recently shown ads (within cooldown period)
4. Select ad using weighted priority algorithm
5. Fall back to oldest impression if all ads recently shown

### Priority Weighting
```typescript
// Priority 1-10 scale
// Higher priority = more likely to be selected
// Selection uses weighted random algorithm

const totalWeight = ads.reduce((sum, ad) => sum + ad.priority, 0);
let random = Math.random() * totalWeight;

for (const ad of ads) {
  random -= ad.priority;
  if (random <= 0) return ad;
}
```

## 🗄️ Database Schema

### AdCreative Model
```prisma
model AdCreative {
  id          String   @id @default(uuid())
  title       String
  description String
  image_url   String
  click_url   String
  slot        String   // list_top, detail_bottom
  priority    Int      @default(5) // 1-10 priority weight
  status      String   @default("active") // active, paused, expired
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  impressions AdImpression[]
}
```

### AdImpression Model (Minimal Tracking)
```prisma
model AdImpression {
  id          String   @id @default(uuid())
  user_id     String?  // nullable for privacy
  group_id    String?  // nullable for privacy
  slot        String   // list_top, detail_bottom
  creative_id String
  shown_at    DateTime @default(now())

  // Relations (optional for privacy)
  user     User?       @relation(fields: [user_id], references: [id], onDelete: SetNull)
  group    Group?      @relation(fields: [group_id], references: [id], onDelete: SetNull)
  creative AdCreative  @relation(fields: [creative_id], references: [id], onDelete: Cascade)
}
```

## 🧪 Testing

Comprehensive test suite with 21 test cases covering:

- **Ad Selection Logic** - Priority weighting, frequency control, slot filtering
- **Impression Logging** - With and without user authentication
- **Privacy Features** - Anonymous ad serving, minimal data collection
- **Admin Functions** - CRUD operations for ad creatives
- **Error Handling** - Invalid ads, missing data, permission checks
- **Statistics** - Performance metrics and reporting

Run tests:
```bash
npm test -- --testPathPattern=ads.service.spec.ts
```

## 📈 Performance Metrics

### Available Statistics
- **Total impressions** - All-time impression count
- **Daily/Weekly/Monthly impressions** - Time-based metrics
- **Active creatives count** - Number of active ads
- **Top performing ads** - Best performing creatives by impressions
- **Slot performance** - Performance by ad placement

### Privacy-Compliant Reporting
- All metrics are aggregated without personal data
- No individual user tracking in reports
- Group-level data is optional and anonymized
- Focus on ad performance, not user behavior

## 🛡️ Content Moderation

### User Reporting System
- Users can report inappropriate ads
- Reports include reason and optional details
- Admin review process for reported content
- Automatic flagging for review (future enhancement)

### Admin Controls
- Pause or expire problematic ads immediately
- Update ad content and targeting
- Monitor performance and user feedback
- Manage ad creative lifecycle

## 🔮 Future Enhancements

- **A/B Testing** - Test different ad creatives and placements
- **Contextual Targeting** - Category-based ad matching (without personal data)
- **Performance Optimization** - Machine learning for better ad selection
- **Advanced Analytics** - More detailed performance insights
- **Content Filtering** - Automated inappropriate content detection
- **Revenue Sharing** - Partner program for local businesses

## 🎯 Compliance & Ethics

### User Experience First
- Never more than one ad per screen
- Ads clearly marked as advertisements
- Native design integration
- Reasonable frequency limits
- Easy reporting mechanism

### Privacy Compliance
- GDPR-compliant minimal data collection
- No cross-site tracking or cookies
- Optional user identification
- Transparent data usage
- User control over ad experience

### Revenue Model
- Sustainable platform funding without user fees
- Non-intrusive advertising approach
- Focus on relevant, useful ad content
- Support for local and relevant businesses
- Transparent revenue generation