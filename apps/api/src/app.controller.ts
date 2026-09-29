// apps/api/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@virtua-lms/types';
import { uptime } from 'node:process';

@Controller()
export class AppController {
    @Get('health')
    getHealth() {
        return {
            status: 'ok',
            service: 'VirtuaLMS API',
            uptime: process.uptime()
        };
    }
}
