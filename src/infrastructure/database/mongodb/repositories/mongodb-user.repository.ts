import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../../domain/entities/user.entity';

@Injectable()
export class MongoDBUserRepository {
  private readonly logger = new Logger(MongoDBUserRepository.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}


  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

}