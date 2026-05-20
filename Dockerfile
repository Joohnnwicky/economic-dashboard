# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time arguments for Vite environment variables
ARG VITE_FRED_API_KEY
ARG VITE_BLS_API_KEY
ARG VITE_ALPHA_VANTAGE_API_KEY

# Set as environment variables for vite build
ENV VITE_FRED_API_KEY=$VITE_FRED_API_KEY
ENV VITE_BLS_API_KEY=$VITE_BLS_API_KEY
ENV VITE_ALPHA_VANTAGE_API_KEY=$VITE_ALPHA_VANTAGE_API_KEY

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source and build (use vite build directly to skip type check)
COPY . .
RUN npx vite build

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]