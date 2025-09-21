# ---- Builder Stage ----
# This stage installs all dependencies, including devDependencies,
# to build the TypeScript source code.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Production Stage ----
# This stage creates the final, lean production image.
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S -g 1001 nodejs
RUN adduser -S -u 1001 -G nodejs hls-proxy

# Copy package files and install ONLY production dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy the built application from the builder stage and set correct permissions
COPY --from=builder --chown=hls-proxy:nodejs /app/dist ./dist

# Switch to the non-root user
USER hls-proxy

EXPOSE 8000

# Healthcheck to verify the service is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD [ "node", "-e", "const http = require('http'); try { const req = http.get('http://localhost:8000/health', { timeout: 2000 }, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); } catch (err) { process.exit(1); }" ]

CMD [ "node", "dist/server/index.js" ]
