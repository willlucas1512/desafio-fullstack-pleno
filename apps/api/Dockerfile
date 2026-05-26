# syntax=docker/dockerfile:1.7
# ----- Stage 1: install all dependencies (dev + prod) for build -----
FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci

# ----- Stage 2: compile TypeScript to dist/ -----
FROM node:22-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/api ./apps/api
RUN npm run build --workspace=apps/api

# ----- Stage 3: install only production dependencies -----
FROM node:22-alpine AS prod-deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --omit=dev

# ----- Stage 4: minimal runtime image -----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV SEED_FILE=/app/data/seed.json
ENV PORT=3001
ENV HOST=0.0.0.0

COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json
COPY data ./data

EXPOSE 3001
USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
