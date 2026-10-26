FROM node:24-slim

# Toolchain in case better-sqlite3 has no prebuilt binary for this platform
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12.5.1

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

ENV NODE_ENV=production DATABASE_PATH=/data/punchcard.db
VOLUME /data
EXPOSE 3000
CMD ["pnpm", "start"]
