import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuthorApplicationDto {
    @ApiProperty({ example: 'Senior Full-Stack Engineer & Cloud Architect' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(120)
    headline: string;

    @ApiProperty({ example: '10+ years building scalable distributed systems and mentoring engineering teams.' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(2000)
    bio: string;

    @ApiProperty({ example: ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker'], type: [String] })
    @IsArray()
    @IsString({ each: true })
    expertise: string[];

    @ApiPropertyOptional({ example: 'https://linkedin.com/in/username' })
    @IsOptional()
    @IsString()
    portfolioUrl?: string;

    @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=sample-video' })
    @IsOptional()
    @IsString()
    sampleVideo?: string;
}
