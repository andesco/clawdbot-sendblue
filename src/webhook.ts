/**
 * Webhook server for receiving Sendblue messages in real-time
 */

import http from 'http';
import type { SendblueMessage } from './types.js';

// Maximum request body size (1MB)
const MAX_BODY_SIZE = 1024 * 1024;

export interface WebhookServerConfig {
  port: number;
  path: string;
  onMessage: (message: SendblueMessage) => Promise<void>;
  logger?: {
    info: (msg: string) => void;
    error: (msg: string) => void;
  };
}

let server: http.Server | null = null;

/**
 * Validate that the payload has required SendblueMessage fields
 */
function isValidSendbluePayload(payload: unknown): payload is SendblueMessage {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  const obj = payload as Record<string, unknown>;
  return (
    typeof obj.message_handle === 'string' &&
    typeof obj.from_number === 'string' &&
    obj.message_handle.length > 0 &&
    obj.from_number.length > 0
  );
}

/**
 * Start the webhook server
 */
export function startWebhookServer(config: WebhookServerConfig): void {
  const { port, path, onMessage, logger } = config;
  const log = logger || { info: console.log, error: console.error };

  if (server) {
    log.info('[Webhook] Server already running');
    return;
  }

  server = http.createServer((req, res) => {
    // Health check endpoint
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // Only handle POST requests to the webhook path
    if (req.method !== 'POST' || !req.url?.startsWith(path)) {
      res.writeHead(404);
      res.end();
      return;
    }

    // Collect request body with size limit
    let body = '';
    let bodyTooLarge = false;

    req.on('data', (chunk: Buffer) => {
      if (bodyTooLarge) return;

      body += chunk.toString();
      if (body.length > MAX_BODY_SIZE) {
        bodyTooLarge = true;
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('error', (err) => {
      log.error(`[Webhook] Request error: ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end();
      }
    });

    req.on('end', async () => {
      if (bodyTooLarge || res.headersSent) return;

      // Parse and validate JSON before responding
      let payload: unknown;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      // Validate required fields
      if (!isValidSendbluePayload(payload)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload: missing required fields' }));
        return;
      }

      // Respond 200 OK - payload is valid, we'll process it
      // This prevents Sendblue from retrying
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));

      // Only process inbound messages
      if (payload.is_outbound) {
        return;
      }

      try {
        log.info(`[Webhook] Received message from ${payload.from_number.slice(-4)}`);
        await onMessage(payload);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log.error(`[Webhook] Error processing message: ${errorMsg}`);
      }
    });
  });

  server.listen(port, () => {
    log.info(`[Webhook] Server listening on port ${port}`);
    log.info(`[Webhook] Endpoint: http://localhost:${port}${path}`);
  });

  server.on('error', (error) => {
    log.error(`[Webhook] Server error: ${error.message}`);
  });
}

/**
 * Stop the webhook server
 */
export function stopWebhookServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }

    server.close(() => {
      server = null;
      resolve();
    });
  });
}

/**
 * Check if webhook server is running
 */
export function isWebhookServerRunning(): boolean {
  return server !== null;
}
