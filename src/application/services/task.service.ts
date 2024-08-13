import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { MongoDBTaskRepository } from '../../infrastructure/database/mongodb/repositories/mongodb-task.repository';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { Task } from '../../domain/entities/task.entity';
import { Types } from 'mongoose';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  constructor(private taskRepository: MongoDBTaskRepository) {}

  async createTask(createTaskDto: CreateTaskDto, projectId: string): Promise<Task> {
    this.logger.debug(`TaskService createTask: ${JSON.stringify(createTaskDto)}`);
    return this.taskRepository.create(createTaskDto, projectId);
  }

  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    this.logger.log(`Getting tasks for project ${projectId}`);
    return this.taskRepository.findByProjectId(projectId);
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    return this.taskRepository.findByUserId(userId);
  }

  async assignTaskToUser(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID "${taskId}" not found`);
    }
    return this.taskRepository.update(taskId, { assignedTo: new Types.ObjectId(userId) });
  }
}