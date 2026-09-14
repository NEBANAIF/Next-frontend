# ============================================================
#  Neba Frontend — Multi-stage Docker build
#  Stage 1: Vite build (Node 20)
#  Stage 2: Nginx static server
#  Note: VITE_API_URL is intentionally empty — Nginx proxies /api/
# ============================================================

# ── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first for layer caching
COPY package*.json ./
RUN npm ci --silent

# Build args (VITE_API_URL left empty — Nginx handles proxy)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────
FROM nginx:1.25-alpine

# Remove default config — we mount our own
RUN rm /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
