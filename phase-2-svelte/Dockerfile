FROM node:22-slim AS build

WORKDIR /app

ARG PUBLIC_API_BASE=http://localhost:3001
ENV PUBLIC_API_BASE=$PUBLIC_API_BASE

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-slim

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

EXPOSE 3000

CMD ["node", "build"]
