#!/bin/bash

# Asegúrate de que este script tenga permisos de ejecución (chmod +x test-project.sh)

echo "Levantando mongo"
docker run -d -p 27017:27017 --name=mongo-test mongo:latest

MONGODB_URI=mongodb://localhost:27017/taskmanagement && JWT_SECRET=hola && yarn run test:e2e

echo "dar de baja mongo-test"
docker stop mongo-test