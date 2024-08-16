import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export const startMemoryServer = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  return uri;
};

export const stopMemoryServer = async () => {
  await mongod.stop();
};