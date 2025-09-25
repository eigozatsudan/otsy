# LLM Integration for Voice-to-Shopping Conversion

This module provides AI-powered shopping list generation using OpenAI's GPT models.

## Features

- **Voice-to-Shopping List**: Convert natural language requests into structured shopping lists
- **Recipe Analysis**: Analyze recipes and generate ingredient lists
- **Interactive Modification**: Modify shopping lists through conversational input
- **Japanese Market Awareness**: Price estimates and availability for Japanese grocery stores
- **Session Management**: Maintain context across multiple interactions

## Setup

1. Get an OpenAI API key from https://platform.openai.com/
2. Add it to your environment variables:
   ```bash
   OPENAI_API_KEY="sk-your-api-key-here"
   ```

## API Endpoints

### Generate Shopping List
```http
POST /v1/llm/generate-shopping-list
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "input": "I want to make oden. I have daikon and chikuwa. Spring chrysanthemum is not needed. Also need toilet paper.",
  "existing_items": ["daikon", "chikuwa"],
  "excluded_items": ["spring chrysanthemum"],
  "dietary_preferences": "no restrictions",
  "serving_size": 4
}
```

**Response:**
```json
{
  "session_id": "uuid-session-id",
  "items": [
    {
      "name": "Konnyaku",
      "qty": "1 pack",
      "price_min": 100,
      "price_max": 200,
      "allow_subs": true,
      "note": "For oden",
      "category": "processed foods",
      "priority": 1
    },
    {
      "name": "Toilet Paper",
      "qty": "1 pack (12 rolls)",
      "price_min": 300,
      "price_max": 500,
      "allow_subs": true,
      "category": "household",
      "priority": 2
    }
  ],
  "total_estimate": 1200,
  "suggestions": ["Consider adding eggs for oden", "Check if you need soy sauce"],
  "context": {
    "recipe": "Oden",
    "meal_type": "dinner",
    "cuisine": "Japanese"
  }
}
```

### Modify Shopping List
```http
POST /v1/llm/modify-shopping-list
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "session_id": "uuid-session-id",
  "modification": "Remove toilet paper and add eggs"
}
```

### Analyze Recipe
```http
POST /v1/llm/analyze-recipe
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "recipe_name": "Chicken Teriyaki",
  "available_ingredients": ["soy sauce", "mirin"],
  "servings": 4
}
```

### Create Order from LLM Session
```http
POST /v1/orders/from-llm-session
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "session_id": "uuid-session-id",
  "mode": "approve",
  "receipt_check": "required",
  "address_json": {
    "street": "1-1-1 Shibuya",
    "city": "Shibuya",
    "postal_code": "150-0002",
    "prefecture": "Tokyo",
    "instructions": "Leave at door"
  },
  "deadline_ts": "2023-12-01T18:00:00Z",
  "priority": 1
}
```

## Usage Flow

1. **Generate Initial List**: User provides natural language input
2. **Review & Modify**: User can modify the list through conversation
3. **Create Order**: Convert the finalized list into an order
4. **Session Cleanup**: Session is automatically cleared after order creation

## Example Inputs

### Meal Planning
- "I want to make pasta carbonara for 4 people"
- "Plan a healthy breakfast for tomorrow"
- "I need ingredients for Japanese curry, but I already have potatoes"

### Shopping Requests
- "I need groceries for the week - family of 3"
- "Emergency shopping: baby formula and diapers"
- "Ingredients for a birthday cake"

### Dietary Considerations
- "Vegetarian dinner for 2, no mushrooms"
- "Gluten-free lunch options"
- "Low-sodium ingredients for elderly person"

## Price Estimation

The system provides price estimates based on typical Japanese grocery store prices:

- **Vegetables**: ¥100-500 per item
- **Meat/Fish**: ¥200-800 per portion
- **Dairy**: ¥150-400 per item
- **Pantry Items**: ¥100-300 per item
- **Household Items**: ¥200-1000 per item

## Error Handling

- **No API Key**: Service gracefully degrades with manual entry fallback
- **Invalid JSON**: Automatic parsing with fallback responses
- **Rate Limits**: Proper error messages and retry suggestions
- **Session Expiry**: Sessions are maintained in memory (consider Redis for production)

## Testing

The module includes comprehensive tests that work with or without an actual OpenAI API key:

```bash
# Run unit tests
npm test llm.service.spec.ts

# Run E2E tests
npm run test:e2e llm.e2e-spec.ts
```

## Production Considerations

1. **Rate Limiting**: Implement user-based rate limiting for API calls
2. **Caching**: Cache common requests to reduce API costs
3. **Session Storage**: Use Redis or database for session persistence
4. **Cost Monitoring**: Monitor OpenAI API usage and costs
5. **Fallback**: Provide manual entry options when AI is unavailable

## Security

- API keys are stored securely in environment variables
- User input is sanitized before sending to OpenAI
- Sessions are isolated per user
- No sensitive data is logged or stored permanently