import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    
    const config = new DocumentBuilder()
        .setTitle('VirtuaLMS API')
        .setDescription('The VirtuaLMS API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 4000;
    await app.listen(port);

    console.log(`🚀 API running on: http://localhost:${port}`);
    console.log(`📚 Swagger documentation at: http://localhost:${port}/api/docs`);
}
bootstrap();
