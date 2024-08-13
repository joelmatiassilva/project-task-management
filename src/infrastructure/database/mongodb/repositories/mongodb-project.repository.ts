import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from '../../../../domain/entities/project.entity';
import { CreateProjectDto } from '../../../../application/dtos/create-project.dto';

@Injectable()
export class MongoDBProjectRepository {
  private readonly logger = new Logger(MongoDBProjectRepository.name);
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    this.logger.debug(`MongoDBProjectRepository create: ${JSON.stringify(createProjectDto)}`);
    const createdProject = new this.projectModel(createProjectDto);
    return createdProject.save();
  }

  async findById(id: string): Promise<Project | null> {
    return this.projectModel.findById(id).exec();
  }

  async findAll(): Promise<Project[]> {
    return this.projectModel.find().exec();
  }
  
  async findByIdWithUsers(id: string): Promise<Project | null> {
    return this.projectModel.findById(id).populate('users').exec();
  }

  async addUserToProject(projectId: string, userId: Types.ObjectId): Promise<Project> {
    const project = await this.projectModel.findByIdAndUpdate(
      projectId,
      { $addToSet: { users: userId } },
      { new: true, runValidators: true }
    );
    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }
    return project;
  }

  async addTaskToProject(projectId: string, taskId: Types.ObjectId): Promise<Project> {
    const project = await this.projectModel.findByIdAndUpdate(
      projectId,
      { $push: { tasks: taskId } },
      { new: true, runValidators: true }
    );
    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }
    return project;
  }
}