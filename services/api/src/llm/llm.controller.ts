import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Patch 
} from '@nestjs/common';
import { LlmService } from './llm.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProcessVoiceInputDto, GetAudioUploadUrlDto } from './dto/voice.dto';

@Controller('llm')
@UseGuards(JwtAuthGuard)
export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    private readonly storageService: StorageService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post('generate-shopping-list')
  async generateShoppingList(
    @CurrentUser() user: any,
    @Body() body: {
      input: string;
      existing_items?: string[];
      dietary_restrictions?: string[];
      budget_level?: number;
    }
  ) {
    return this.llmService.generateShoppingList({
      input: body.input,
      existing_items: body.existing_items,
      dietary_restrictions: body.dietary_restrictions,
      budget_level: body.budget_level,
    });
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post('process-voice')
  async processVoiceInput(
    @CurrentUser() user: any,
    @Body() processVoiceDto: ProcessVoiceInputDto
  ) {
    const result = await this.llmService.processVoiceInput(
      processVoiceDto.audio_url,
      {
        language: processVoiceDto.language,
        existing_items: processVoiceDto.existing_items,
        dietary_restrictions: processVoiceDto.dietary_restrictions,
        budget_level: processVoiceDto.budget_level,
      }
    );

    return {
      transcription: result.transcription,
      shopping_list: result.shopping_list,
      processing_time_ms: result.processing_time_ms,
    };
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post('audio-upload-url')
  async getAudioUploadUrl(
    @CurrentUser() user: any,
    @Body() getUploadUrlDto: GetAudioUploadUrlDto
  ) {
    const folder = `audio/${user.id}`;
    const { uploadUrl, fileUrl } = await this.storageService.generateUploadUrl(
      folder, 
      getUploadUrlDto.file_extension
    );

    return {
      upload_url: uploadUrl,
      file_url: fileUrl,
    };
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const session = this.llmService.getSession(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }

    return {
      session_id: session.session_id,
      items: session.current_items,
      confidence_score: session.confidence_score,
      created_at: session.created_at,
    };
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Patch('sessions/:sessionId')
  async updateShoppingList(
    @Param('sessionId') sessionId: string,
    @Body() body: { modifications: string }
  ) {
    return this.llmService.updateShoppingList(sessionId, body.modifications);
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post('sessions/:sessionId/clear')
  async clearSession(@Param('sessionId') sessionId: string) {
    this.llmService.clearSession(sessionId);
    return { message: 'Session cleared successfully' };
  }

  @UseGuards(RolesGuard)
  @Roles('user')
  @Post('transcribe')
  async transcribeAudio(
    @CurrentUser() user: any,
    @Body() body: {
      audio_url: string;
      language?: string;
    }
  ) {
    const transcription = await this.llmService.transcribeAudio(
      body.audio_url,
      body.language
    );

    return {
      transcription,
      language: body.language || 'ja',
    };
  }
}