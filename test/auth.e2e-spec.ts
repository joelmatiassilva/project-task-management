import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Authentication System', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  it('should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'nuevo_usuario@ejemplo.com', password: 'contraseña123' });
    
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('access_token');
  });
  
  it('should login a user', async () => {
    // Primero, registrar un usuario
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'usuario_login@ejemplo.com', password: 'contraseña123' });

    // Luego, intentar el login
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'usuario_login@ejemplo.com', password: 'contraseña123' });
    
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toHaveProperty('access_token');
  });
});