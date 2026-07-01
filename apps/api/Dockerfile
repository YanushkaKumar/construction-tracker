# ── Stage 1: Dependencies ────────────────────
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps && cp -R node_modules /prod_modules
RUN npm install --legacy-peer-deps

# ── Stage 2: Build ───────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate
RUN npm run build

# ── Stage 3: Development ─────────────────────
FROM node:20-alpine AS development
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate
EXPOSE 4000 9229
CMD ["npm", "run", "start:dev"]

# ── Stage 4: Production ─────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /prod_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./
EXPOSE 4000
CMD ["node", "dist/src/main"]
