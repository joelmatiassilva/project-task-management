import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: false,
    exceptionFactory: (errors) => {
      console.log('Validation errors:', JSON.stringify(errors, null, 2));
      // Aquí puedes personalizar el mensaje de error si lo deseas
    },
  }));

  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('API for managing projects and tasks')
    .setVersion('1.0')
    .addTag('tasks')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();