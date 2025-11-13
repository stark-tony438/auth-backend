import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

function normalizeOrigin(origin?: string | null): string | undefined {
  if (!origin) return undefined;
  return origin.replace(/\/+$/, ''); // remove trailing slashes
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Middlewares
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // --- ✅ CORS configuration ---
  const appUrl = config.get<string>('APP_URL', '');
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  // Normalize allowed origins
  const allowedOrigins = [
    normalizeOrigin(appUrl), // Amplify
    normalizeOrigin('http://localhost:3000'), // Local dev frontend
    normalizeOrigin('http://localhost:4000'), // Local API testing
  ].filter(Boolean) as string[];

  console.log('✅ Allowed CORS origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server or tools with no origin (like curl, Postman)
      if (!origin) return callback(null, true);

      const requestOrigin = normalizeOrigin(origin);
      if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      console.warn('🚫 CORS blocked for origin:', origin);
      return callback(new Error(`Not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    optionsSuccessStatus: 204,
  });

  // --- ✅ Swagger setup (only for non-production) ---
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('UmrahTaxi API')
      .setDescription('API documentation for authentication and services')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refreshToken')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    console.log('📘 Swagger docs available at /docs');
  }

  // --- ✅ Server start ---
  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
