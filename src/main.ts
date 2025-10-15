import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import * as dotenv from "dotenv";
import { ErrorHandlingInterceptor } from "./common/interceptors/error-handling.interceptor";
import helmet from "helmet";
import { logger } from "./common/logger/winston-logger";
import * as cookieParser from "cookie-parser";

dotenv.config(); // Load environment variables

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Helmet for security
  app.use(helmet());

  // Enable cookie parser
  app.use(cookieParser() as any);

  // Enable CORS with custom configuration
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000", // Always allow localhost for development
      "https://localhost:3000", // Allow HTTPS localhost
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization, Cookie",
    credentials: true, // Enables credentials (cookies, authorization headers)
  });

  // Enable global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("One Night Box API")
    .setDescription("API documentation for the One Night Box service")
    .setVersion("1.0")
    .addBearerAuth() // Adds JWT authentication support
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document); // Accessible at http://localhost:8000/api/docs
  app.useGlobalInterceptors(new ErrorHandlingInterceptor());

  app.useLogger(logger);
  await app.listen(process.env.PORT || 8000);
}

void bootstrap();
