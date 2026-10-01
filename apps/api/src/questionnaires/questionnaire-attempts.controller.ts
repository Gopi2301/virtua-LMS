import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QuestionnairesService } from './questionnaires.service';
import { StartAttemptDto, SubmitAttemptDto } from './dto';

@ApiTags('Questionnaire Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questionnaires/:questionnaireId/attempts')
export class QuestionnaireAttemptsController {
  constructor(private readonly questionnairesService: QuestionnairesService) {}

  @Post('start')
  @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Start a new questionnaire attempt (or resume active one)' })
  @ApiParam({ name: 'questionnaireId', description: 'Questionnaire UUID' })
  @ApiResponse({ status: 201, description: 'Attempt started with sanitized questions' })
  @ApiResponse({ status: 400, description: 'Max attempts reached or invalid enrollment' })
  @ApiResponse({ status: 404, description: 'Questionnaire not found' })
  start(
    @Param('questionnaireId', ParseUUIDPipe) questionnaireId: string,
    @Body() dto: StartAttemptDto,
    @Req() req: any,
  ) {
    return this.questionnairesService.startAttempt(questionnaireId, req.user.id, dto);
  }

  @Post(':attemptId/submit')
  @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Submit answers for a questionnaire attempt, calculate score and update progress' })
  @ApiParam({ name: 'questionnaireId', description: 'Questionnaire UUID' })
  @ApiParam({ name: 'attemptId', description: 'Attempt UUID' })
  @ApiResponse({ status: 201, description: 'Attempt scored and review returned' })
  @ApiResponse({ status: 400, description: 'Attempt already submitted or invalid payload' })
  @ApiResponse({ status: 403, description: 'Attempt belongs to another student' })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  submit(
    @Param('questionnaireId', ParseUUIDPipe) questionnaireId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() dto: SubmitAttemptDto,
    @Req() req: any,
  ) {
    return this.questionnairesService.submitAttempt(
      questionnaireId,
      attemptId,
      req.user.id,
      dto,
    );
  }

  @Get()
  @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List user attempts for a questionnaire' })
  @ApiParam({ name: 'questionnaireId', description: 'Questionnaire UUID' })
  @ApiResponse({ status: 200, description: 'List of past and current attempts' })
  listAttempts(
    @Param('questionnaireId', ParseUUIDPipe) questionnaireId: string,
    @Req() req: any,
  ) {
    return this.questionnairesService.getUserAttempts(questionnaireId, req.user.id);
  }

  @Get(':attemptId')
  @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get details of a specific attempt' })
  @ApiParam({ name: 'questionnaireId', description: 'Questionnaire UUID' })
  @ApiParam({ name: 'attemptId', description: 'Attempt UUID' })
  @ApiResponse({ status: 200, description: 'Attempt details and review if submitted' })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  getAttempt(
    @Param('questionnaireId', ParseUUIDPipe) questionnaireId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Req() req: any,
  ) {
    return this.questionnairesService.getAttemptDetails(
      questionnaireId,
      attemptId,
      req.user.id,
    );
  }
}
