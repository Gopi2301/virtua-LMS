import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CourseContentGuard, ContentKind } from '../auth/course-content.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResourceType } from '@prisma/client';
import { ResourcesService } from './resources.service';
import {
  CreateResourceDto,
  ReorderResourcesDto,
  UpdateResourceDto,
} from './dto';
import { saveAssetToServer } from '../utils/storage.helper';

@ApiTags('Resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, CourseContentGuard)
@Roles('AUTHOR', 'MANAGER', 'SUPER_ADMIN')
@ContentKind('resource')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post('upload-file')
  @ContentKind('course')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  }))
  @ApiOperation({ summary: 'Upload a resource file (PDF, ZIP, DOC, etc.)' })
  @ApiConsumes('multipart/form-data')
  async uploadFileOnly(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('File is required for upload');
    }
    const expectedType = req.body?.expectedType || req.query?.expectedType;
    const lowerName = file.originalname.toLowerCase();
    const isPdf = file.mimetype.includes('pdf') || lowerName.endsWith('.pdf');
    const isZip =
      file.mimetype.includes('zip') ||
      file.mimetype.includes('compressed') ||
      lowerName.endsWith('.zip') ||
      lowerName.endsWith('.tar') ||
      lowerName.endsWith('.gz') ||
      lowerName.endsWith('.rar') ||
      lowerName.endsWith('.7z');

    if (expectedType === 'PDF' && !isPdf) {
      throw new BadRequestException(
        `Cannot upload "${file.originalname}" as PDF. Please upload a valid PDF document or change the resource type.`,
      );
    }

    if (expectedType === 'ZIP' && !isZip) {
      throw new BadRequestException(
        `Cannot upload "${file.originalname}" as ZIP archive. Please upload a valid archive file or change the resource type.`,
      );
    }

    const stored = await saveAssetToServer(file, 'resources');
    const host = req.get('host');
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}${stored.url}`;

    let resourceType = 'EXTERNAL_LINK';
    if (isPdf) {
      resourceType = 'PDF';
    } else if (isZip) {
      resourceType = 'ZIP';
    }

    return {
      url: fullUrl,
      path: stored.url,
      fileName: stored.fileName,
      fileSize: stored.fileSize,
      mimeType: stored.mimeType,
      storageKey: stored.storageKey,
      resourceType,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Add a new resource to a session (URL, GitHub, or pre-uploaded file)' })
  @ApiResponse({ status: 201, description: 'Resource created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  create(@Body() createResourceDto: CreateResourceDto, @Req() req: any) {
    return this.resourcesService.create(createResourceDto, req.user.id, req.user.roles);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload and attach a file resource (PDF, ZIP) to a session' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        type: { type: 'string', enum: ['PDF', 'ZIP'] },
        file: { type: 'string', format: 'binary' },
      },
      required: ['sessionId', 'file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded and resource created' })
  @ApiResponse({ status: 400, description: 'No file provided or invalid input' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
    @Body('title') title: string,
    @Body('type') type: ResourceType,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required for upload');
    }

    if (!sessionId) {
      throw new BadRequestException('SessionId is required');
    }
    // Guards run before multipart parsing. The query ID is checked by the
    // content guard; require the parsed body to refer to that same session.
    if (req.query.sessionId !== sessionId) {
      throw new BadRequestException('Provide the same sessionId in the upload query and body');
    }

    const resourceType = type || (file.mimetype.includes('pdf') ? ResourceType.PDF : ResourceType.ZIP);

    return this.resourcesService.uploadFile(
      sessionId,
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
        path: file.path,
      },
      title,
      resourceType,
      req.user.id,
      req.user.roles,
    );
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder resources within a session' })
  @ApiResponse({ status: 200, description: 'Resources reordered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid resource IDs supplied' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  reorder(@Body() reorderDto: ReorderResourcesDto, @Req() req: any) {
    return this.resourcesService.reorder(reorderDto, req.user.id);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get all resources for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Resources fetched successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findAllBySession(@Param('sessionId') sessionId: string) {
    return this.resourcesService.findAllBySession(sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource UUID' })
  @ApiResponse({ status: 200, description: 'Resource fetched successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a resource' })
  @ApiParam({ name: 'id', description: 'Resource UUID' })
  @ApiResponse({ status: 200, description: 'Resource updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  update(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
    @Req() req: any,
  ) {
    return this.resourcesService.update(id, updateResourceDto, req.user.id, req.user.roles);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resource' })
  @ApiParam({ name: 'id', description: 'Resource UUID' })
  @ApiResponse({ status: 200, description: 'Resource deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.resourcesService.remove(id, req.user.id, req.user.roles);
  }
}
