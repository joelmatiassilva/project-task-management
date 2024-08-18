import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ProjectController } from './infrastructure/adapters/controllers/project.controller';
import { AuthController } from './infrastructure/adapters/controllers/auth.controller';
import { TaskController } from './infrastructure/adapters/controllers/task.controller';
import { ProjectService } from './application/services/project.service';
import { AuthService } from './application/services/auth.service';
import { TaskService } from './application/services/task.service';
import { MongoDBProjectRepository } from './infrastructure/database/mongodb/repositories/mongodb-project.repository';
import { MongoDBTaskRepository } from './infrastructure/database/mongodb/repositories/mongodb-task.repository';
import { User, UserSchema } from './domain/entities/user.entity';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { Task, TaskSchema } from './domain/entities/task.entity';
import { Project, ProjectSchema } from './domain/entities/project.entity';
import { RequestLoggerMiddleware } from './infrastructure/middlewares/equest-logger.middleware';
import {PingController} from './infrastructure/adapters/controllers/ping.controller';
import { MongooseConfigService } from './mongoose-config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ProjectController, AuthController, TaskController, PingController],
  providers: [
    ProjectService,
    AuthService,
    TaskService,
    MongoDBProjectRepository,
    MongoDBTaskRepository,
    JwtStrategy,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}