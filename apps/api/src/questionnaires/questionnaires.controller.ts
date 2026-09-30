import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CourseContentGuard, ContentKind } from '../auth/course-content.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QuestionnairesService } from './questionnaires.service';
import {
  CreateOptionDto,
  CreateQuestionDto,
  CreateQuestionnaireDto,
  UpdateOptionDto,
  UpdateQuestionDto,
  UpdateQuestionnaireDto,
} from './dto';

@ApiTags('Questionnaires')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, CourseContentGuard)
@Roles('AUTHOR', 'MANAGER', 'SUPER_ADMIN')
@ContentKind('questionnaire')
@Controller('questionnaires')
export class QuestionnairesController {
  constructor(private readonly questionnairesService: QuestionnairesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a questionnaire for a session' })
  @ApiResponse({ status: 201, description: 'Questionnaire created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Questionnaire already exists for this session' })
  create(@Body() createDto: CreateQuestionnaireDto, @Req() req: any) {
    return this.questionnairesService.create(createDto, req.user.id);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get questionnaire with questions and options for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Questionnaire fetched successfully' })
  @ApiResponse({ status: 404, description: 'Session or questionnaire not found' })
  findBySessionId(@Param('sessionId') sessionId: string) {
    return this.questionnairesService.findBySessionId(sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a questionnaire by ID with all questions and options' })
  @ApiParam({ name: 'id', description: 'Questionnaire UUID' })
  @ApiResponse({ status: 200, description: 'Questionnaire fetched successfully' })
  @ApiResponse({ status: 404, description: 'Questionnaire not found' })
  findOne(@Param('id') id: string) {
    return this.questionnairesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update questionnaire settings' })
  @ApiParam({ name: 'id', description: 'Questionnaire UUID' })
  @ApiResponse({ status: 200, description: 'Questionnaire updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Questionnaire not found' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuestionnaireDto,
    @Req() req: any,
  ) {
    return this.questionnairesService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a questionnaire' })
  @ApiParam({ name: 'id', description: 'Questionnaire UUID' })
  @ApiResponse({ status: 200, description: 'Questionnaire deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Questionnaire not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.questionnairesService.remove(id, req.user.id);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add a question to a questionnaire' })
  @ApiParam({ name: 'id', description: 'Questionnaire UUID' })
  @ApiResponse({ status: 201, description: 'Question added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Questionnaire not found' })
  addQuestion(
    @Param('id') id: string,
    @Body() createQuestionDto: CreateQuestionDto,
    @Req() req: any,
  ) {
    return this.questionnairesService.addQuestion(id, createQuestionDto, req.user.id);
  }

  @Patch(':id/questions/:qId')
  @ApiOperation({ summary: 'Update a question in a questionnaire' })
  @ApiParam({ name: 'id', description: 'Questionnaire UUID' })
  @ApiParam({ name: 'qId', description: 'Question UUID' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  updateQuestion(
    @Param('id') id: string,
    @Param('qId') qId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Req() req: any,
  ) {
    return this.questionnairesService.updateQuestion(id, qId, updateQuestionDto, req.user.id);
  }

  @Delete(':id/questions/:qId')
  @ApiOperation({ summary: 'Delete a question from a questionnaire' })
  @ApiParam({ name: 'id', description: 'Questionnaire UUID' })
  @ApiParam({ name: 'qId', description: 'Question UUID' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  removeQuestion(
    @Param('id') id: string,
    @Param('qId') qId: string,
    @Req() req: any,
  ) {
    return this.questionnairesService.removeQuestion(id, qId, req.user.id);
  }

  @Post('questions/:qId/options')
  @ApiOperation({ summary: 'Add an answer option to a question' })
  @ApiParam({ name: 'qId', description: 'Question UUID' })
  @ApiResponse({ status: 201, description: 'Option added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  addOption(
    @Param('qId') qId: string,
    @Body() createOptionDto: CreateOptionDto,
    @Req() req: any,
  ) {
    return this.questionnairesService.addOption(qId, createOptionDto, req.user.id);
  }

  @Patch('questions/:qId/options/:oId')
  @ApiOperation({ summary: 'Update an answer option' })
  @ApiParam({ name: 'qId', description: 'Question UUID' })
  @ApiParam({ name: 'oId', description: 'Option UUID' })
  @ApiResponse({ status: 200, description: 'Option updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Option not found' })
  updateOption(
    @Param('qId') qId: string,
    @Param('oId') oId: string,
    @Body() updateOptionDto: UpdateOptionDto,
    @Req() req: any,
  ) {
    return this.questionnairesService.updateOption(qId, oId, updateOptionDto, req.user.id);
  }

  @Delete('questions/:qId/options/:oId')
  @ApiOperation({ summary: 'Delete an answer option' })
  @ApiParam({ name: 'qId', description: 'Question UUID' })
  @ApiParam({ name: 'oId', description: 'Option UUID' })
  @ApiResponse({ status: 200, description: 'Option deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Option not found' })
  removeOption(
    @Param('qId') qId: string,
    @Param('oId') oId: string,
    @Req() req: any,
  ) {
    return this.questionnairesService.removeOption(qId, oId, req.user.id);
  }
}

