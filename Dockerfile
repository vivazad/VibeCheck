# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build backend
WORKDIR /app/backend
RUN npm run build

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Production stage - Backend
FROM node:20-alpine AS backend

WORKDIR /app

# Copy backend package files and install production dependencies only
COPY --from=builder /app/backend/package*.json ./
RUN npm install --omit=dev

# Copy built backend
COPY --from=builder /app/backend/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S vibecheck && \
    adduser -S vibecheck -u 1001 -G vibecheck
USER vibecheck

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]

# Production stage - Frontend (nginx)
FROM nginx:alpine AS frontend

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built frontend
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Create non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
