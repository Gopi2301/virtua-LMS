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
import { SessionsService } from './sessions.service';
import {
  CreateSessionDto,
  ReorderSessionsDto,
  UpdateSessionDto,
} from './dto';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course session inside a section' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  create(@Body() createSessionDto: CreateSessionDto, @Req() req: any) {
    return this.sessionsService.create(createSessionDto, req.user.id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder sessions within a section' })
  @ApiResponse({ status: 200, description: 'Sessions reordered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid session IDs supplied' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  reorder(@Body() reorderDto: ReorderSessionsDto, @Req() req: any) {
    return this.sessionsService.reorder(reorderDto, req.user.id);
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get all sessions for a section with video and resources' })
  @ApiParam({ name: 'sectionId', description: 'Section UUID' })
  @ApiResponse({ status: 200, description: 'Sessions fetched successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  findAllBySection(@Param('sectionId') sectionId: string) {
    return this.sessionsService.findAllBySection(sectionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a session by ID' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Session fetched successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a session' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Session updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Req() req: any,
  ) {
    return this.sessionsService.update(id, updateSessionDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a session' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.remove(id, req.user.id);
  }
}
