FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/engine ./src/engine
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /data

EXPOSE 3000
ENV DB_PATH=/data/finplan.db

CMD ["node_modules/.bin/tsx", "server/main.ts"]
