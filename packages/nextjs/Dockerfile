# Etapa 1: Construcción de la aplicación con Node.js
FROM node:23.3.0-slim AS builder

WORKDIR /app

# Habilitar Corepack para Yarn 3+ y establecer versión específica
RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

# Copiar archivos de dependencias primero (optimización de caché)
COPY package.json ./

# Forzar instalación de dependencias sin PnP
ENV YARN_NODE_LINKER=node-modules

RUN yarn install

# Copiar el código fuente y compilar Next.js
COPY . .

RUN yarn build

# Verificar si la carpeta .next existe
RUN ls -la /app/.next

# Etapa 2: Servir con Next.js en producción
FROM node:23.3.0-slim

# -- Add curl and any other needed utilities
RUN apt-get update && apt-get install -y curl

WORKDIR /app

# Habilitar Corepack en producción
RUN corepack enable \
    && corepack prepare yarn@3.2.3 --activate \
    && yarn set version 3.2.3

# Copiar solo los archivos esenciales desde la etapa de construcción
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/tsconfig.json ./

RUN yarn install

# Exponer el puerto
EXPOSE 3001

# Ejecutar Next.js en modo producción
CMD ["yarn", "serve"]
