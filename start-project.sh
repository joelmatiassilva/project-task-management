#!/bin/bash

# Asegúrate de que este script tenga permisos de ejecución (chmod +x start-project.sh)

echo "Deteniendo y eliminando contenedores existentes..."
docker compose down

echo "Construyendo las imágenes Docker..."
docker compose build

echo "Iniciando los servicios..."
docker compose up -d

echo "Esperando a que MongoDB esté listo..."
sleep 10

echo "Instalando dependencias..."
docker compose exec app yarn install

echo "Mostrando logs de la aplicación..."
docker compose logs -f app