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
import { VideosService } from './videos.service';
import { AttachVideoDto, UpdateVideoDto } from './dto';

@ApiTags('Videos')
@ApiBearerAuth()
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @ApiOperation({ summary: 'Attach a video to a session (accepts Vimeo ID or generates dummy video)' })
  @ApiResponse({ status: 201, description: 'Video attached successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Video already attached to session or Vimeo ID collision' })
  attach(@Body() attachVideoDto: AttachVideoDto, @Req() req: any) {
    return this.videosService.attach(attachVideoDto, req.user.id);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get video attached to a session' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Video fetched successfully' })
  @ApiResponse({ status: 404, description: 'Session or video not found' })
  findBySessionId(@Param('sessionId') sessionId: string) {
    return this.videosService.findBySessionId(sessionId);
  }

  @Patch(':sessionId')
  @ApiOperation({ summary: 'Update video metadata for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Video updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Session or video not found' })
  @ApiResponse({ status: 409, description: 'Vimeo ID collision' })
  update(
    @Param('sessionId') sessionId: string,
    @Body() updateVideoDto: UpdateVideoDto,
    @Req() req: any,
  ) {
    return this.videosService.update(sessionId, updateVideoDto, req.user.id);
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Detach / delete video from a session' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Video detached successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Session or video not found' })
  remove(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.videosService.remove(sessionId, req.user.id);
  }
}
