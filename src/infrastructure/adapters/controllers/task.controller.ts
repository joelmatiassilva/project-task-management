import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from '../../../application/services/task.service';
import { CreateTaskDto } from '../../../application/dtos/create-task.dto';
import { UpdateTaskDto } from '../../../application/dtos/update-task.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskController {
  private readonly logger = new Logger(TaskController.name);

  constructor(private taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'The task has been successfully created.' })
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    this.logger.log(`Creating new task`);
    return this.taskService.createTask(createTaskDto, createTaskDto.projectId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all tasks for a project' })
  @ApiResponse({ status: 200, description: 'Return all tasks for the specified project.' })
  async getTasksByProject(@Param('projectId') projectId: string) {
    this.logger.log(`Getting tasks for project ${projectId}`);
    return this.taskService.getTasksByProjectId(projectId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all tasks assigned to a user' })
  @ApiResponse({ status: 200, description: 'Return all tasks assigned to the specified user.' })
  async getTasksByUser(@Param('userId') userId: string) {
    this.logger.log(`Getting tasks for user ${userId}`);
    return this.taskService.getTasksByUserId(userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'The task has been successfully updated.' })
  async updateTask(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    this.logger.log(`Updating task ${id}`);
    return this.taskService.updateTask(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'The task has been successfully deleted.' })
  async deleteTask(@Param('id') id: string) {
    this.logger.log(`Deleting task ${id}`);
    return this.taskService.deleteTask(id);
  }

  @Put(':id/assign/:userId')
  @ApiOperation({ summary: 'Assign a task to a user' })
  @ApiResponse({ status: 200, description: 'The task has been successfully assigned.' })
  async assignTaskToUser(@Param('id') id: string, @Param('userId') userId: string) {
    this.logger.log(`Assigning task ${id} to user ${userId}`);
    return this.taskService.assignTaskToUser(id, userId);
  }

  @Delete(':id/assign')
  @ApiOperation({ summary: 'Remove user assignment from a task' })
  @ApiResponse({ status: 200, description: 'The user assignment has been successfully removed from the task.' })
  async removeUserFromTask(@Param('id') id: string) {
    this.logger.log(`Removing user assignment from task ${id}`);
    return this.taskService.removeUserFromTask(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiResponse({ status: 200, description: 'Return the task with the specified id.' })
  async getTaskById(@Param('id') id: string) {
    this.logger.log(`Getting task with id ${id}`);
    return this.taskService.getTaskById(id);
  }
}