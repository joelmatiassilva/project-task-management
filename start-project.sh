#!/bin/bash

# Asegúrate de que este script tenga permisos de ejecución (chmod +x start-project.sh)

# Detener y eliminar contenedores existentes
echo "Deteniendo y eliminando contenedores existentes..."
docker compose down

# Construir las imágenes (si es necesario)
echo "Construyendo las imágenes Docker..."
docker compose build

# Iniciar los servicios
echo "Iniciando los servicios..."
docker compose up -d

# Esperar a que MongoDB esté listo
echo "Esperando a que MongoDB esté listo..."
sleep 10

# Instalar dependencias
echo "Instalando dependencias..."
docker compose exec app yarn install

# Ejecutar migraciones (si las tienes)
# echo "Ejecutando migraciones..."
# docker-compose exec app yarn migrate

# Mostrar los logs de la aplicación
echo "Mostrando logs de la aplicación..."
docker compose logs -f app