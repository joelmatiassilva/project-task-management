import { Controller, Get, Post, Body, Param, UseGuards, Logger, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectService } from '../../../application/services/project.service';
import { CreateProjectDto } from '../../../application/dtos/create-project.dto';
import { CreateTaskDto } from '../../../application/dtos/create-task.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectController {
  private readonly logger = new Logger(ProjectController.name);
  constructor(private projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'The project has been successfully created.' })
  async createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.createProject(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'Return all projects.' })
  async getAllProjects() {
    return this.projectService.getAllProjects();
  }

  @Post(':id/users/:userId')
  @ApiOperation({ summary: 'Add a user to a project' })
  @ApiResponse({ status: 200, description: 'The user has been successfully added to the project.' })
  async addUserToProject(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectService.addUserToProject(id, userId);
  }

  @Post(':projectId/tasks')
  @ApiOperation({ summary: 'Add a task to a project' })
  @ApiResponse({ status: 201, description: 'The task has been successfully added to the project.' })
  async addTaskToProject(
    @Param('projectId') projectId: string, 
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: Request
  ) {
    this.logger.log(`Adding task to project ${projectId}`);
    try {
      const result = await this.projectService.addTaskToProject(projectId, createTaskDto);
      this.logger.log(`Task added successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error adding task to project: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project with its tasks and users' })
  @ApiResponse({ status: 200, description: 'Return the project with its tasks and users.' })
  async getProjectWithTasksAndUsers(@Param('id') id: string) {
    this.logger.log(`getProjectWithTasksAndUsers ${id}`);
    return this.projectService.getProjectWithTasksAndUsers(id);
  }

  @Get(':projectId/tasks')
  @ApiOperation({ summary: 'Get all tasks for a project' })
  @ApiResponse({ status: 200, description: 'Returns all tasks for the specified project.' })
  async getProjectTasks(@Param('projectId') projectId: string) {
    this.logger.log(`Getting tasks for project ${projectId}`);
    
    try {
      const tasks = await this.projectService.getProjectTasks(projectId);
      this.logger.log(`Retrieved ${tasks.length} tasks for project ${projectId}`);
      return tasks;
    } catch (error) {
      this.logger.error(`Error getting tasks for project: ${error.message}`);
      throw error;
    }
  }
}