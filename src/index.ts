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

  log.debug?.('[Sendblue Plugin] Registering channel...');

  const channel = createSendblueChannel(api);
  api.registerChannel({ plugin: channel });

  log.debug?.('[Sendblue Plugin] Channel registered');

  // Register service to handle polling lifecycle
  api.registerService({
    id: 'sendblue-poller',
    start: () => {
      log.debug?.('[Sendblue Plugin] Service starting...');
      const config = api.pluginConfig;
      if (config) {
        startSendblueService(api, config);
      } else {
        log.warn('[Sendblue Plugin] No config found, service not started');
      }
    },
    stop: () => {
      log.debug?.('[Sendblue Plugin] Service stopping...');
      stopSendblueService();
    },
  });

  log.debug?.('[Sendblue Plugin] Service registered');
}
