import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class GenerateShoppingListDto {
  @IsString()
  input: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  existing_items?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietary_restrictions?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  budget_level?: number; // 1-10 scale for price estimation
}

export class ModifyShoppingListDto {
  @IsString()
  session_id: string;

  @IsString()
  modification: string; // Natural language modification request
}

export class ShoppingListItemDto {
  name: string;
  qty: string;
  category: string;
  price_min?: number;
  price_max?: number;
  allow_subs: boolean;
  note?: string;
  confidence: number; // 0-1 confidence score from LLM
}

export class ShoppingListResponseDto {
  session_id: string;
  items: ShoppingListItemDto[];
  total_estimate_min: number;
  total_estimate_max: number;
  processing_time_ms: number;
  suggestions?: string[];
  warnings?: string[];
}

export class IngredientAnalysisDto {
  @IsString()
  recipe_or_dish: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  servings?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  available_ingredients?: string[];
}

export class RecipeAnalysisResponseDto {
  dish_name: string;
  servings: number;
  ingredients: {
    name: string;
    qty: string;
    essential: boolean;
    available: boolean;
    substitutes?: string[];
  }[];
  missing_ingredients: ShoppingListItemDto[];
  cooking_time?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export class ConversationContextDto {
  session_id: string;
  user_input: string;
  previous_items: ShoppingListItemDto[];
  conversation_history: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
}