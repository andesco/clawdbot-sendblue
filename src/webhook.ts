/**
 * Webhook server for receiving Sendblue messages in real-time
 */

import http from 'http';
import type { SendblueMessage } from './types.js';

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
 * Start the webhook server
 */
export function startWebhookServer(config: WebhookServerConfig): void {
  const { port, path, onMessage, logger } = config;
  const log = logger || { info: console.log, error: console.error };

  if (server) {
    log.info('[Webhook] Server already running');
    return;
  }

  server = http.createServer(async (req, res) => {
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

    // Collect request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      // Respond immediately to avoid duplicate webhook calls from Sendblue
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));

      try {
        const payload = JSON.parse(body) as SendblueMessage;

        // Only process inbound messages
        if (payload.is_outbound) {
          return;
        }

        log.info(`[Webhook] Received message from ${payload.from_number?.slice(-4) || 'unknown'}`);
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
