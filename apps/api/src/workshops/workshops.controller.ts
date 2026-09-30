import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkshopsService } from './workshops.service';
import {
  CreateWorkshopDto,
  QueryWorkshopDto,
  UpdateWorkshopDto,
  UpdateWorkshopStatusDto,
} from './dto';

@ApiTags('Workshops')
@ApiBearerAuth()
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new live workshop' })
  @ApiResponse({ status: 201, description: 'Workshop created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Product slug conflict' })
  create(@Body() createWorkshopDto: CreateWorkshopDto, @Req() req: any) {
    return this.workshopsService.create(createWorkshopDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List workshops with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Workshops fetched successfully' })
  findAll(@Query() query: QueryWorkshopDto) {
    return this.workshopsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workshop by ID or slug' })
  @ApiParam({ name: 'id', description: 'Workshop UUID or slug' })
  @ApiResponse({ status: 200, description: 'Workshop fetched successfully' })
  @ApiResponse({ status: 404, description: 'Workshop not found' })
  findOne(@Param('id') id: string) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workshop details and schedule' })
  @ApiParam({ name: 'id', description: 'Workshop UUID or product ID' })
  @ApiResponse({ status: 200, description: 'Workshop updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Workshop not found' })
  update(
    @Param('id') id: string,
    @Body() updateWorkshopDto: UpdateWorkshopDto,
    @Req() req: any,
  ) {
    return this.workshopsService.update(id, updateWorkshopDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workshop' })
  @ApiParam({ name: 'id', description: 'Workshop UUID or product ID' })
  @ApiResponse({ status: 200, description: 'Workshop deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Workshop not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.workshopsService.remove(id, req.user.id);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update workshop live status (SCHEDULED, LIVE, COMPLETED, CANCELLED)' })
  @ApiParam({ name: 'id', description: 'Workshop UUID or product ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Workshop not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkshopStatusDto,
    @Req() req: any,
  ) {
    return this.workshopsService.updateStatus(id, dto.status, req.user.id);
  }
}
