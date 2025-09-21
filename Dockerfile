# ---- Base Stage ----
FROM node:22-alpine AS base
WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# ---- Builder Stage ----
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM base AS production
ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup -S -g 1001 nodejs
RUN adduser -S -u 1001 -G nodejs hls-proxy
USER hls-proxy

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code and built files
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 8000

# Healthcheck to verify the service is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD [ "node", "-e", "const http = require('http'); try { const req = http.get('http://localhost:8000/health', { timeout: 2000 }, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); } catch (err) { process.exit(1); }" ]

CMD [ "node", "dist/server/index.js" ]
