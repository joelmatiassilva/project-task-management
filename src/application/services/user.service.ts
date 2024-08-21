import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { MongoDBUserRepository } from '../../infrastructure/database/mongodb/repositories/mongodb-user.repository';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private userRepository: MongoDBUserRepository) {}


  async getUserById(id: string): Promise<User> {
    this.logger.log(`Getting user with id ${id}`);
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

}