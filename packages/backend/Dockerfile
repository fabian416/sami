# Etapa 1: Construcción
FROM node:23.3.0-slim AS builder

WORKDIR /app

# Copia solo los archivos necesarios para instalar dependencias
COPY package*.json ./
RUN yarn install

# Copia el resto del código fuente y compila
COPY . .
RUN yarn build

# Etapa 2: Producción
FROM node:23.3.0-slim

# -- Add curl and any other needed utilities
RUN apt-get update && apt-get install -y curl

WORKDIR /app

# Copia solo los archivos esenciales desde la etapa de construcción
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expone el puerto del backend
EXPOSE 5001

# Comando para ejecutar el backend
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
