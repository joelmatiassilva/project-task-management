import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from '../../../../domain/entities/task.entity';
import { CreateTaskDto } from '../../../../application/dtos/create-task.dto';

@Injectable()
export class MongoDBTaskRepository {
  private readonly logger = new Logger(MongoDBTaskRepository.name);
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  async create(createTaskDto: CreateTaskDto, projectId: string): Promise<Task> {
    this.logger.debug(`MongoDBTaskRepository create: ${JSON.stringify(createTaskDto)}`);
    const createdTask = new this.taskModel({...createTaskDto, projectId});
    return createdTask.save();
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    return this.taskModel.find({ projectId: new Types.ObjectId(projectId) }).exec();
  }

  async findByUserId(userId: string): Promise<Task[]> {
    return this.taskModel.find({ assignedTo: new Types.ObjectId(userId) }).exec();
  }

  async findById(id: string): Promise<Task | null> {
    return this.taskModel.findById(id).exec();
  }

  async update(id: string, updateData: Partial<Task>): Promise<Task> {
    const task = await this.taskModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }
}