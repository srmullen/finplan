FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM oven/bun:1-slim
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/engine ./src/engine
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /data

EXPOSE 3000
ENV DB_PATH=/data/finplan.db

CMD ["bun", "run", "server/index.ts"]
