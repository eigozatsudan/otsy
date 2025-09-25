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
  modification: string; // e.g., "remove spring chrysanthemum", "add toilet paper"
}

export class ShoppingListItemDto {
  name: string;
  qty: string;
  category: string;
  price_min: number;
  price_max: number;
  alternatives: string[];
  notes?: string;
  priority: number; // 1-5, 5 being highest priority
}

export class ShoppingListResponseDto {
  session_id: string;
  items: ShoppingListItemDto[];
  total_estimate_min: number;
  total_estimate_max: number;
  suggestions: string[];
  confidence_score: number; // 0-1
  processing_time_ms: number;
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
}import { IsString, IsOptional, IsArray, IsNumber, Min, Max, IsBoolean } from 'class-validator';

ex@IsOptional()
  @IsArray()
  @IsString({ each: true })
  available_ingredients?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  servings?: number;
}

export class RecipeIngredientsResponseDto {
  recipe_name: string;
  ingredients: ShoppingListItemDto[];
  instructions?: string[];
  prep_time?: number;
  cook_time?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}port class GenerateShoppingListDto {
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
  servings?: number = 4;

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