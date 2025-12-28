import cron from 'node-cron';
import { config } from './config.js';
import { ClickUpClient } from './services/clickup.js';
import { DiscordClient } from './services/discord.js';
import { TrackerClient } from './services/tracker.js';
import { Notifier } from './notifier.js';

const { app: appConfig } = config;

async function execute() {
  console.log('Starting ClickUp check...');

  const clickup = new ClickUpClient(config.clickup);
  const discord = new DiscordClient(config.discord, appConfig);
  const tracker = new TrackerClient(config.redis);

  const notifier = new Notifier(clickup, discord, tracker, appConfig);

  try {
    await notifier.run();
    console.log('Check completed successfully');
  } catch (error) {
    console.error('Check failed:', error.message);
  } finally {
    await tracker.close();
  }
}

execute();
cron.schedule(appConfig.cronSchedule, execute);
