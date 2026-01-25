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

  // Check what an existing channel (telegram) looks like
  if (api.runtime?.channel?.telegram) {
    const telegramKeys = Object.keys(api.runtime.channel.telegram);
    log.info(`[Sendblue Plugin] telegram channel has: ${telegramKeys.join(', ')}`);
  }

  // Check what registerChannel returns - maybe it gives us a dispatcher?
  log.info(`[Sendblue Plugin] registerChannel returns: ${typeof api.registerChannel({plugin: {id:'test'}})}`);

  // Check if there's a sendblue channel after registration
  // (we'll log this again after registering)

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
