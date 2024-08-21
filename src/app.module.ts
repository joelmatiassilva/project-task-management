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
import { UserService } from './application/services/user.service';
import { MongoDBProjectRepository } from './infrastructure/database/mongodb/repositories/mongodb-project.repository';
import { MongoDBUserRepository } from './infrastructure/database/mongodb/repositories/mongodb-user.repository';
import { MongoDBTaskRepository } from './infrastructure/database/mongodb/repositories/mongodb-task.repository';
import { User, UserSchema } from './domain/entities/user.entity';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { Task, TaskSchema } from './domain/entities/task.entity';
import { Project, ProjectSchema } from './domain/entities/project.entity';
import { RequestLoggerMiddleware } from './infrastructure/middlewares/equest-logger.middleware';
import { PingController}  from './infrastructure/adapters/controllers/ping.controller';
import { MongooseConfigService } from './mongoose-config';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
    ClientsModule.registerAsync([
      {
        name: 'KAFKA',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get<string>('KAFKA_CLIENT_ID'),
              brokers: [configService.get<string>('KAFKA_BROKER')],
              ssl: true,
              sasl: {
                mechanism: 'plain',
                username: configService.get<string>('KAFKA_USERNAME'),
                password: configService.get<string>('KAFKA_PASSWORD'),
              },
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    ProjectController, 
    AuthController, 
    TaskController, 
    PingController
  ],
  providers: [
    ProjectService,
    AuthService,
    TaskService,
    UserService,
    MongoDBProjectRepository,
    MongoDBTaskRepository,
    MongoDBUserRepository,
    JwtStrategy,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}