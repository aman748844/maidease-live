# Multi-stage Dockerfile for MaidEase Live
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies and build frontend
RUN npm --prefix backend install --omit=dev
RUN npm --prefix frontend install
COPY frontend/ ./frontend/
RUN npm --prefix frontend run build

# Final minimal production image
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

# Copy backend dependencies and code
COPY package.json ./
COPY backend/ ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 5001

CMD ["npm", "start"]
