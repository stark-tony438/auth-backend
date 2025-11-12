import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

function normalizeOrigin(origin?: string | null) {
  if (!origin) return origin;
  return origin.replace(/\/+$/, ''); // remove trailing slashes
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true }, // optional: auto-cast types
    }),
  );
  const allowed = [process.env.APP_URL.replace(/\/+$/, '')];

  app.enableCors({
    origin: (origin, callback) => {
      // allow server-to-server and tools with no origin
      if (!origin) return callback(null, true);

      const requestOrigin = normalizeOrigin(origin);
      if (allowed.includes(requestOrigin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
    optionsSuccessStatus: 204,
  });

  const nodeEnv = config.get('NODE_ENV') || 'development';
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('My API')
      .setDescription('Auth + other endpoints')
      .setVersion('1.0')
      .addBearerAuth()
      // register cookie auth so UI knows refresh-token is cookie-based
      .addCookieAuth('refreshToken')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    // docs available at: http://<host>:<port>/docs
    console.log('Swagger docs available at /docs');
  }
  const port = config.get('PORT') || 4000;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}
bootstrap();
