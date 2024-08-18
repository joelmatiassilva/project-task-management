import { Injectable } from '@nestjs/common';
   import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';

   @Injectable()
   export class MongooseConfigService implements MongooseOptionsFactory {
     createMongooseOptions(): MongooseModuleOptions {
       return {
         uri: 'mongodb://mongodb:27017/taskmanagement',
         serverSelectionTimeoutMS: 5000,
         retryAttempts: 5,
         retryDelay: 1000,
         connectionFactory: (connection) => {
           connection.on('connected', () => {
             console.log('MongoDB connection established successfully');
           });
           connection.on('disconnected', () => {
             console.log('MongoDB connection disconnected');
           });
           connection.on('error', (error) => {
             console.error('MongoDB connection error:', error);
           });
           return connection;
         }
       };
     }
   }