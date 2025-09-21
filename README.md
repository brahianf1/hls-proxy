# HLS Proxy Service

A robust, high-performance HLS proxy service built with Node.js, Fastify, and TypeScript. This service acts as a middleman between a client player and an upstream HLS stream source, rewriting manifest URLs on the fly to proxy all traffic.

## Features

- **Dynamic HLS Proxying**: Proxies HLS master manifests, media manifests, and segments.
- **URL Rewriting**: Automatically rewrites HLS manifest URLs to point to the proxy.
- **Session Management**: Creates temporary sessions for each playback request.
- **External Resolver Integration**: Calls an external service to resolve the original HLS manifest URL from a source ID.
- **Production-Ready Docker Support**: Optimized, multi-stage Dockerfile for secure and lightweight production deployments.
- **Configuration-Driven**: Easily configurable through environment variables, ideal for CI/CD and containerized environments.
- **Secure by Design**: Uses an API key for endpoint protection and a non-root user in the Docker container.

---

## Configuration

This project is configured via environment variables. Create a `.env` file in the root of the project and add the following variables.

```env
# --- Server Configuration ---
# The port the application will listen on.
PORT=8000

# The public URL of the application. Used to generate full playback URLs.
APP_PUBLIC_URL=http://localhost:8000

# --- Security ---
# A secret key to protect the /api/v1/play endpoint.
API_KEY=super-secret-api-key

# Comma-separated list of allowed origins for CORS.
CORS_ORIGINS=http://localhost:3000,https://my-frontend-app.com

# --- Resolver Service ---
# The base URL of the external resolver service.
RESOLVER_BASE_URL=http://your-resolver-service.com/api

# The API key for the resolver service.
RESOLVER_API_KEY=resolver-secret-key

# --- HLS Proxy ---
# How long a playback session should be valid (in seconds).
SESSION_TTL_S=900

# Default Accept-Language header to use for upstream requests.
ACCEPT_LANGUAGE='en-US,en;q=0.8'

# --- Stream Sources ---
# A JSON string mapping source IDs to their original URLs.
# This is the recommended way for containerized environments.
SOURCE_MAP_JSON='{"source-abc":"https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8"}'
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js (v22 or higher recommended)
- npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd hls-proxy
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment:**
    Create a `.env` file in the project root and configure the variables as described in the "Configuration" section above.

### Running the Service

1.  **Compile the TypeScript code:**
    ```bash
    npm run build
    ```

2.  **Start the server:**
    ```bash
    npm start
    ```

The service will be running at `http://localhost:8000` (or the port you configured).

---

## API Usage

### `GET /api/v1/play`

Initiates a new playback session and returns the proxy URLs for the HLS manifest.

**Query Parameters:**
- `sourceId` (string, required): The ID of the source to play. Must be a key present in the `SOURCE_MAP_JSON` configuration.

**Headers:**
- `x-api-key` (string, required): The API key to authenticate the request.

**Example Request:**
```bash
curl -v -H "x-api-key: super-secret-api-key" "http://localhost:8000/api/v1/play?sourceId=source-abc"
```

**Example Success Response (200 OK):**
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "playbackUrl": "/hls/a1b2c3d4-e5f6-7890-1234-567890abcdef/master.m3u8",
  "fullPlaybackUrl": "http://localhost:8000/hls/a1b2c3d4-e5f6-7890-1234-567890abcdef/master.m3u8"
}
```

Use the `fullPlaybackUrl` in your HLS player (e.g., VLC, hls.js demo page).

---

## Docker Deployment (Production)

The project includes an optimized `Dockerfile` for building a lightweight and secure production image.

### Building the Image

```bash
docker build -t hls-proxy .
```

### Running the Container

To run the container, you must provide all the required environment variables. You can do this with the `-e` flag or a file with the `--env-file` flag.

```bash
docker run -d \
  -p 8000:8000 \
  -e PORT=8000 \
  -e APP_PUBLIC_URL=http://your-public-domain.com \
  -e API_KEY=your-production-api-key \
  -e CORS_ORIGINS=https://your-frontend-domain.com \
  -e RESOLVER_BASE_URL=... \
  -e RESOLVER_API_KEY=... \
  -e 'SOURCE_MAP_JSON={"source-prod":"https://.../stream.m3u8"}' \
  --name hls-proxy-container \
  hls-proxy
```

The service is now running and exposed on port 8000 of the host machine.
