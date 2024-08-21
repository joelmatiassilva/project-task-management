import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { MongoDBTaskRepository } from '../../infrastructure/database/mongodb/repositories/mongodb-task.repository';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { UpdateTaskDto } from '../dtos/update-task.dto';
import { Task, TaskStatus } from '../../domain/entities/task.entity';
import { Types } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { UserService } from './user.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  constructor(
    private taskRepository: MongoDBTaskRepository,
    @Inject('KAFKA')
    private readonly kafka: ClientProxy,
    private readonly userService: UserService, // Inyecta el UserService
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
    
    const [task, user] = await Promise.all([
      this.taskRepository.findById(taskId),
      this.userService.getUserById(userId), // Asumimos que existe este método en UserService
    ]);

    if (!task) {
      throw new NotFoundException(`Task with ID "${taskId}" not found`);
    }

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    try {
      const body = `Se te asignó la tarea: "${task.title}"`;
      const to = user.email;
      const subject = "Nueva tarea asignada";
      this.logger.log(`assing - Send a email to ${to}`);
      this.kafka.emit("task", {
        body,
        to,
        subject
      });
    } catch (error) {
      this.logger.error(`Error emitting task assignment for user ${userId}`, error.stack);
    }
    
    return this.taskRepository.update(taskId, { assignedTo: new Types.ObjectId(userId) });
  }

  async removeUserFromTask(taskId: string): Promise<Task> {
    this.logger.log(`Removing user assignment from task ${taskId}`);
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID "${taskId}" not found`);
    }

    let userEmail = "joelsilva.1987@gmail.com"; // Default email
    if (task.assignedTo) {
      const user = await this.userService.getUserById(task.assignedTo.toString());
      if (user) {
        userEmail = user.email;
      }
    }
    this.logger.log(`removeUserFromTask - Send a email to ${userEmail}`);
    try {
      const body = `Se te retiró la tarea: "${task.title}"`;
      const to = userEmail;
      const subject = "Tarea retirada";
      this.kafka.emit("task", {
        body,
        to,
        subject
      });
    } catch (error) {
      this.logger.error(`Error emitting task removal for task ${taskId}`, error.stack);
    }
    return this.taskRepository.update(taskId, { assignedTo: null });
  }
}