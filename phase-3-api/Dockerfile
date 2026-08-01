FROM node:22-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev \
  && rm -f node_modules/better-sqlite3/prebuilds/linux-arm64.node node_modules/better-sqlite3/prebuilds/linux-x64.node \
  && npm rebuild better-sqlite3

COPY . .

RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "index.js"]
