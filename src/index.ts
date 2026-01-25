/**
 * Clawdbot Sendblue Plugin
 *
 * Registers a Sendblue messaging channel for iMessage/SMS support.
 */

import { createSendblueChannel, startSendblueService, stopSendblueService } from './channel.js';

/**
 * Plugin entry point
 * Called by clawdbot to register the plugin
 */
export default function register(api: any) {
  const log = api.logger || console;

  // Debug: log available API methods
  const keys = Object.keys(api);
  log.info(`[Sendblue Plugin] API has ${keys.length} methods: ${keys.join(', ')}`);

  // Explore runtime.channel.text - likely for dispatching text messages
  if (api.runtime?.channel?.text) {
    const textKeys = Object.keys(api.runtime.channel.text);
    log.info(`[Sendblue Plugin] channel.text has: ${textKeys.join(', ')}`);
    for (const key of textKeys) {
      log.info(`[Sendblue Plugin]   text.${key}: ${typeof api.runtime.channel.text[key]}`);
    }
  }

  // Explore runtime.channel.routing
  if (api.runtime?.channel?.routing) {
    const routingKeys = Object.keys(api.runtime.channel.routing);
    log.info(`[Sendblue Plugin] channel.routing has: ${routingKeys.join(', ')}`);
    for (const key of routingKeys) {
      log.info(`[Sendblue Plugin]   routing.${key}: ${typeof api.runtime.channel.routing[key]}`);
    }
  }

  // Check pluginConfig
  if (api.pluginConfig) {
    log.info(`[Sendblue Plugin] pluginConfig keys: ${Object.keys(api.pluginConfig).join(', ')}`);
  }

  log.info('[Sendblue Plugin] Registering channel...');

  const channel = createSendblueChannel(api);
  api.registerChannel({ plugin: channel });

  log.info('[Sendblue Plugin] Channel registered');

  // Register service to handle polling lifecycle
  api.registerService({
    id: 'sendblue-poller',
    start: () => {
      log.info('[Sendblue Plugin] Service starting...');
      const config = api.config?.plugins?.entries?.sendblue?.config;
      if (config) {
        startSendblueService(api, config);
      } else {
        log.warn('[Sendblue Plugin] No config found, service not started');
      }
    },
    stop: () => {
      log.info('[Sendblue Plugin] Service stopping...');
      stopSendblueService();
    },
  });

  log.info('[Sendblue Plugin] Service registered');
}
