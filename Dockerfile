# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Instalar Nest CLI globalmente en el contenedor para dev mode
RUN npm install -g @nestjs/cli

COPY package*.json ./
RUN npm install

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]