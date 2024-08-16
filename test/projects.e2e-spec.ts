import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Projects CRUD', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let jwtToken: string;

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

    // Register and login to get JWT token
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'testuser@example.com', password: 'testpassword' });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'testuser@example.com', password: 'testpassword' });
    jwtToken = loginResponse.body.access_token;
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

  it('should create a new project', async () => {
    const response = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ title: 'Test Project', description: 'This is a test project' });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body.title).toEqual('Test Project');
    expect(response.body).toHaveProperty('_id');
    expect(response.body.description).toEqual('This is a test project');
  });

  it('should get all projects', async () => {
    // First, create a project
    await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ title: 'Project 1', description: 'Description 1' });

    const response = await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(response.status).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[1].title).toEqual('Project 1');
  });

  it('should update a project', async () => {
    // First, create a project
    const createResponse = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ title: 'Project to Update', description: 'Initial description' });

    const projectId = createResponse.body._id;

    const updateResponse = await request(app.getHttpServer())
      .put(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ title: 'Updated Project', description: 'Updated description' });

    expect(updateResponse.status).toBe(HttpStatus.OK);
    expect(updateResponse.body.title).toEqual('Updated Project');
    expect(updateResponse.body.description).toEqual('Updated description');
  });

  it('should delete a project', async () => {
    // First, create a project
    const createResponse = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ title: 'Project to Delete', description: 'To be deleted' });

    const projectId = createResponse.body._id;

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(deleteResponse.status).toBe(HttpStatus.OK);

    // Try to get the deleted project
    const getResponse = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(getResponse.status).toBe(HttpStatus.NOT_FOUND);
  });
});