import type { FastifyRequest, FastifyReply } from 'fastify';
import { Parser } from 'm3u8-parser';
import { sessionManager } from '../sessions/store.js';
import { fetchUpstream } from './upstream.client.js';
import { manifestRewriteCounter } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';
import { getAbsoluteUrl } from '../../utils/url.js';

const HLS_MIME_TYPE = 'application/vnd.apple.mpegurl; charset=utf-8';

async function masterManifestHandler(request: FastifyRequest, reply: FastifyReply) {
  const { sessionId } = request.params as any;
  const session = sessionManager.get(sessionId);
  if (!session) {
    return reply.code(404).send({ error: 'Session not found' });
  }

  try {
    const upstreamResponse = await fetchUpstream(session.masterUrl, session, {});
    if (!upstreamResponse.ok) {
      return reply.code(upstreamResponse.status).send(upstreamResponse.statusText);
    }

    const manifestText = await upstreamResponse.text();
    const lines = manifestText.split('\n');
    
    let rewriteNextLine = false;
    const rewrittenLines = lines.map((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        return line;
      }
    
      if (trimmedLine.startsWith('#EXT-X-STREAM-INF')) {
        rewriteNextLine = true;
        return line;
      }
    
      if (rewriteNextLine && !trimmedLine.startsWith('#')) {
        rewriteNextLine = false;
        const absoluteUrl = getAbsoluteUrl(trimmedLine, session.masterUrl);
        return `/hls/${sessionId}/media/${encodeURIComponent(absoluteUrl)}`;
      }
      
      if (trimmedLine.startsWith('#EXT-X-MEDIA')) {
          const uriRegex = /URI="([^"]+)"/;
          const uriMatch = trimmedLine.match(uriRegex);
          if (uriMatch && uriMatch[1]) {
              const uri = uriMatch[1];
              const absoluteUrl = getAbsoluteUrl(uri, session.masterUrl);
              const rewrittenUri = `/hls/${sessionId}/media/${encodeURIComponent(absoluteUrl)}`;
              return trimmedLine.replace(uriRegex, `URI="${rewrittenUri}"`);
          }
      }
    
      return line;
    });

    const rewrittenManifest = rewrittenLines.join('\n');
    
    manifestRewriteCounter.inc({ sessionId, type: 'master' });
    logger.info({ sessionId }, 'Rewriting master manifest');

    reply.header('Content-Type', HLS_MIME_TYPE);
    return reply.send(rewrittenManifest);
  } catch (error: any) {
    logger.error(error, `Failed to process master manifest for session ${sessionId}`);
    return reply.code(500).send({ error: 'Failed to process master manifest' });
  }
}

async function mediaManifestHandler(request: FastifyRequest, reply: FastifyReply) {
  const { sessionId, '*': encodedMediaUrl } = request.params as any;
  if (!encodedMediaUrl) {
    return reply.code(400).send({ error: 'Missing media playlist URL' });
  }
  const mediaManifestUrl = decodeURIComponent(encodedMediaUrl);

  const session = sessionManager.get(sessionId);
  if (!session) {
    return reply.code(404).send({ error: 'Session not found' });
  }

  try {
    const upstreamResponse = await fetchUpstream(mediaManifestUrl, session, {});
    if (!upstreamResponse.ok) {
      return reply.code(upstreamResponse.status).send(upstreamResponse.statusText);
    }

    const manifestText = await upstreamResponse.text();
    const rewrittenManifest = manifestText
      .split('\n')
      .map((line) => {
        if (line.startsWith('#') || !line.trim()) {
          return line;
        }
        const absoluteUrl = getAbsoluteUrl(line, mediaManifestUrl);
        return `/hls/${sessionId}/segment/${encodeURIComponent(absoluteUrl)}`;
      })
      .join('\n');

    manifestRewriteCounter.inc({ sessionId, type: 'media' });
    logger.info({ sessionId, mediaManifestUrl }, 'Rewriting media manifest');

    reply.header('Content-Type', HLS_MIME_TYPE);
    return reply.send(rewrittenManifest);
  } catch (error: any) {
    logger.error(error, `Failed to process media manifest for session ${sessionId}`);
    return reply.code(500).send({ error: 'Failed to process media manifest' });
  }
}

async function segmentHandler(request: FastifyRequest, reply: FastifyReply) {
  const { sessionId, '*': encodedSegmentUrl } = request.params as any;
  if (!encodedSegmentUrl) {
    return reply.code(400).send({ error: 'Missing segment URL' });
  }
  const segmentUrl = decodeURIComponent(encodedSegmentUrl);

  const session = sessionManager.get(sessionId);
  if (!session) {
    return reply.code(404).send({ error: 'Session not found' });
  }

  try {
    const upstreamResponse = await fetchUpstream(segmentUrl, session, {});
    if (!upstreamResponse.ok) {
      return reply.code(upstreamResponse.status).send(upstreamResponse.statusText);
    }

    const body = await upstreamResponse.arrayBuffer();
    
    // Copy safe headers from upstream
    const safeHeaders = ['content-type', 'cache-control', 'expires', 'last-modified', 'etag'];
    for (const [key, value] of upstreamResponse.headers.entries()) {
      if (safeHeaders.includes(key.toLowerCase())) {
        reply.header(key, value);
      }
    }

    return reply.send(Buffer.from(body));
  } catch (error: any) {
    logger.error(error, `Failed to process segment for session ${sessionId}`);
    return reply.code(500).send({ error: 'Failed to process segment' });
  }
}

export const hlsProxyHandlers = {
  masterManifestHandler,
  mediaManifestHandler,
  segmentHandler,
};
