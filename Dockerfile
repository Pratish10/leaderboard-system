FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY ./prisma ./prisma
COPY ./.env ./.env
COPY ./tsconfig.json ./

RUN npm ci

RUN npm run generate

COPY . .

RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/wal.log ./wal.log
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 8000

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/server.js"]