import { IsString, IsOptional, IsArray, IsInt, Min, Max } from 'class-validator';

export class ProcessVoiceInputDto {
  @IsString()
  audio_url: string; // URL to uploaded audio file

  @IsOptional()
  @IsString()
  language?: string = 'ja'; // Default to Japanese

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  existing_items?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietary_restrictions?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  budget_level?: number;
}

export class VoiceProcessingResponse {
  transcription: string;
  shopping_list: {
    session_id: string;
    items: any[];
    confidence_score: number;
    suggestions: string[];
    total_estimate: number;
  };
  processing_time_ms: number;
}

export class GetAudioUploadUrlDto {
  @IsOptional()
  @IsString()
  file_extension?: string = 'wav';
}