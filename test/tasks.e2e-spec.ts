import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Tasks CRUD', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let jwtToken: string;
  let projectId: string;
  let userId: string;

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
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'testuser@example.com', password: 'testpassword' });
    userId = registerResponse.body.userId;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'testuser@example.com', password: 'testpassword' });
    jwtToken = loginResponse.body.access_token;

    // Create a project to associate tasks with
    const projectResponse = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ title: 'Test Project', description: 'Project for task tests' });
    projectId = projectResponse.body._id;
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

  it('should create a new task', async () => {
    const response = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ 
        title: 'Test Task', 
        description: 'This is a test task',
        projectId: projectId
      });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body.title).toEqual('Test Task');
    expect(response.body).toHaveProperty('_id');
    expect(response.body.description).toEqual('This is a test task');
    expect(response.body.projectId).toEqual(projectId);
  });

  it('should get all tasks for a project', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ 
        title: 'Task 1', 
        description: 'Description 1',
        projectId: projectId
      });

    const response = await request(app.getHttpServer())
      .get(`/tasks/project/${projectId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(response.status).toBe(HttpStatus.OK);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].title).toEqual('Test Task');
  });

  it('should update a task', async () => {
    // First, create a task
    const createResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ 
        title: 'Task to Update', 
        description: 'Initial description',
        projectId: projectId
      });

    const taskId = createResponse.body._id;

    const updateResponse = await request(app.getHttpServer())
      .put(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ title: 'Updated Task', description: 'Updated description' });

    expect(updateResponse.status).toBe(HttpStatus.OK);
    expect(updateResponse.body.title).toEqual('Updated Task');
    expect(updateResponse.body.description).toEqual('Updated description');
  });

  it('should delete a task', async () => {
    // First, create a task
    const createResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ 
        title: 'Task to Delete', 
        description: 'To be deleted',
        projectId: projectId
      });

    const taskId = createResponse.body._id;

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(deleteResponse.status).toBe(HttpStatus.OK);

    // Try to get the deleted task
    const getResponse = await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(getResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should assign a user to a task', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ 
        title: 'Task to Assign', 
        description: 'To be assigned',
        projectId: projectId
      });

    const taskId = createResponse.body._id;
    const assignResponse = await request(app.getHttpServer())
      .put(`/tasks/${taskId}/assign/${userId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(assignResponse.status).toBe(HttpStatus.OK);
    expect(assignResponse.body.assignedTo).toEqual(userId);
    const getResponse = await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(getResponse.status).toBe(HttpStatus.OK);
    expect(getResponse.body.assignedTo).toEqual(userId);

  });

  it('should remove user assignment from a task', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ 
        title: 'Task to Unassign', 
        description: 'To be unassigned',
        projectId: projectId
      });

    const taskId = createResponse.body._id;

    await request(app.getHttpServer())
      .put(`/tasks/${taskId}/assign/${userId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    const removeResponse = await request(app.getHttpServer())
      .delete(`/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(removeResponse.status).toBe(HttpStatus.OK);
    expect(removeResponse.body.assignedTo).toBeNull();
    
    const getResponse = await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(getResponse.status).toBe(HttpStatus.OK);
    expect(getResponse.body.assignedTo).toBeNull();

  });

  it('should get a task by id', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ 
        title: 'Task to Get', 
        description: 'This task will be retrieved',
        projectId: projectId
      });

    const taskId = createResponse.body._id;
    const getResponse = await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(getResponse.status).toBe(HttpStatus.OK);
    expect(getResponse.body._id).toEqual(taskId);
    expect(getResponse.body.title).toEqual('Task to Get');
    expect(getResponse.body.description).toEqual('This task will be retrieved');
    expect(getResponse.body.projectId).toEqual(projectId);
  });
});