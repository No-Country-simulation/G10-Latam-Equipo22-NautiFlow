FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache wget

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM deps AS build
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
# URL ficticia: solo se necesita para generar el cliente en build.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npm run build && npm prune --omit=dev

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY package.json package-lock.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
