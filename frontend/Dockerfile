# syntax=docker/dockerfile:1

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
