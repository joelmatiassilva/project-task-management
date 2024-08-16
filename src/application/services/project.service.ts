import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { MongoDBProjectRepository } from '../../infrastructure/database/mongodb/repositories/mongodb-project.repository';
import { TaskService } from './task.service';
import { CreateProjectDto } from '../dtos/create-project.dto';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { Project } from '../../domain/entities/project.entity';
import { Task } from '../../domain/entities/task.entity';
import { UpdateProjectDto } from '../dtos/update-project.dto';
import { Types } from 'mongoose';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);
  constructor(
    private projectRepository: MongoDBProjectRepository,
    private taskService: TaskService,
  ) {}

  async createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectRepository.create(createProjectDto);
  }

  async addUserToProject(projectId: string, userId: string): Promise<Project> {
    return this.projectRepository.addUserToProject(projectId, new Types.ObjectId(userId));
  }

  async getAllProjects(): Promise<Project[]> {
    return this.projectRepository.findAll();
  }

  async addTaskToProject(projectId: string, createTaskDto: CreateTaskDto): Promise<Task> {
    //this.logger.log(`Adding task to project ${createTaskDto.projectId}`);
    this.logger.debug(`Task DTO 2: ${JSON.stringify(createTaskDto)}`);
    const task = await this.taskService.createTask(
      createTaskDto, projectId
    );
    this.logger.debug(`projectId: ${projectId}`);
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }
    
    await this.projectRepository.addTaskToProject(projectId, task._id as unknown as Types.ObjectId);
    return task;
  }

  async getProjectWithTasksAndUsers(projectId: string): Promise<Omit<Project, 'tasks'> & { tasks: Task[], users: any[] }> {
    const project = await this.projectRepository.findByIdWithUsers(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }
    const tasks = await this.taskService.getTasksByProjectId(projectId);
    const { tasks: _, ...projectWithoutTasks } = project.toObject();
    return { ...projectWithoutTasks, tasks };
  }

  async getProjectTasks(projectId: string): Promise<Task[]> {
    this.logger.log(`Getting tasks for project ${projectId}`);

    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      this.logger.warn(`Project with ID "${projectId}" not found`);
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    const tasks = await this.taskService.getTasksByProjectId(projectId);
    this.logger.log(`Retrieved ${tasks.length} tasks for project ${projectId}`);

    return tasks;
  }

  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    this.logger.log(`Updating project ${projectId}`);
    const updatedProject = await this.projectRepository.update(projectId, updateProjectDto);
    if (!updatedProject) {
      this.logger.warn(`Project with ID "${projectId}" not found`);
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }
    this.logger.log(`Project ${projectId} updated successfully`);
    return updatedProject;
  }

  async deleteProject(projectId: string): Promise<void> {
    this.logger.log(`Deleting project ${projectId}`);
    const result = await this.projectRepository.delete(projectId);
    if (!result) {
      this.logger.warn(`Project with ID "${projectId}" not found`);
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }
    this.logger.log(`Project ${projectId} deleted successfully`);
  }
}