/**
 * Clawdbot Sendblue Plugin
 *
 * Registers a Sendblue messaging channel for iMessage/SMS support.
 */

import { createSendblueChannel } from './channel.js';

/**
 * Plugin entry point
 * Called by clawdbot to register the plugin
 */
export default function register(api: any) {
  const log = api.logger || console;

  log.info('[Sendblue Plugin] Registering channel...');

  const channel = createSendblueChannel(api);
  api.registerChannel({ plugin: channel });

  log.info('[Sendblue Plugin] Channel registered');
}
