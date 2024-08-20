import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { MongoDBTaskRepository } from '../../infrastructure/database/mongodb/repositories/mongodb-task.repository';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { Task, TaskStatus } from '../../domain/entities/task.entity';
import { Types } from 'mongoose';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  constructor(
    private taskRepository: MongoDBTaskRepository,
    @Inject('KAFKA')
    private readonly kafka: ClientProxy,
  ) {}

  async createTask(createTaskDto: CreateTaskDto, projectId: string): Promise<Task> {
    this.logger.debug(`TaskService createTask: ${JSON.stringify(createTaskDto)}`);
    return this.taskRepository.create(createTaskDto, projectId);
  }

  async getTaskById(id: string): Promise<Task> {
    this.logger.log(`Getting task with id ${id}`);
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }

  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    this.logger.log(`Getting tasks for project ${projectId}`);
    return this.taskRepository.findByProjectId(projectId);
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    return this.taskRepository.findByUserId(userId);
  }

  async updateTask(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    this.logger.log(`Updating task ${id}`);
    
    const updateData: Partial<Task> = {};

    if (updateTaskDto.title !== undefined) updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) updateData.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined) updateData.status = updateTaskDto.status as TaskStatus;
    if (updateTaskDto.dueDate !== undefined) updateData.dueDate = new Date(updateTaskDto.dueDate);
    if (updateTaskDto.assignedTo !== undefined) {
      updateData.assignedTo = new Types.ObjectId(updateTaskDto.assignedTo);
    }

    return this.taskRepository.update(id, updateData);
  }

  async deleteTask(id: string): Promise<void> {
    this.logger.log(`Deleting task ${id}`);
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    await this.taskRepository.delete(id);
  }

  async assignTaskToUser(taskId: string, userId: string): Promise<Task> {
    this.logger.log(`Assigning task ${taskId} to user ${userId}`);
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID "${taskId}" not found`);
    }
    try {
      let body: String = `Se te asignó la tarea: "${taskId}"`;
      let to: string = "joelsilva.1987@gmail.com";
      let subject: string = "Tareas";
      this.kafka.emit("task",{
        body,
        to,
        subject
      });
    } catch (error) {
      this.logger.error(`Error emit task ${userId}`);
    }
    
    return this.taskRepository.update(taskId, { assignedTo: new Types.ObjectId(userId) });
  }

  async removeUserFromTask(taskId: string): Promise<Task> {
    this.logger.log(`Removing user assignment from task ${taskId}`);
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID "${taskId}" not found`);
    }
    try {
      let body: String = `Se te retiró la tarea: "${taskId}"`;
      let to: string = "joelsilva.1987@gmail.com";
      let subject: string = "Tareas";
      this.kafka.emit("task",{
        body,
        to,
        subject
      });
    } catch (error) {
      this.logger.error(`Error emit task ${taskId}`);
    }
    return this.taskRepository.update(taskId, { assignedTo: null });
  }
}