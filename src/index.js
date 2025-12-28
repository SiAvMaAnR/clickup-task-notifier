import cron from 'node-cron';
import { config } from './config.js';
import { ClickUpClient } from './services/clickup.js';
import { DiscordClient } from './services/discord.js';
import { TrackerClient } from './services/tracker.js';
import { Notifier } from './notifier.js';
import { logger } from './utils/logger.js';

const { app: appConfig } = config;

async function execute() {
  logger.info('Starting script...');

  const clickup = new ClickUpClient(config.clickup);
  const discord = new DiscordClient(config.discord, appConfig);
  const tracker = new TrackerClient(config.redis);

  const notifier = new Notifier(clickup, discord, tracker, appConfig);

  try {
    await notifier.run();
    logger.info('Script completed');
  } catch (error) {
    logger.error('Script failed:', error.message);
  } finally {
    await tracker.close();
  }
}

cron.schedule(appConfig.cronSchedule, execute);
