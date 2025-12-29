import 'dotenv/config';
import { STATUS } from './constants.js';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export const config = {
  clickup: {
    token: required('CLICKUP_TOKEN'),
    folderId: required('CLICKUP_FOLDER_ID'),
    baseUrl: 'https://api.clickup.com/api/v2',
  },
  discord: {
    webhook: {
      newTask: required('DISCORD_WEBHOOK_NEW_TASKS'),
      incompleteTask: required('DISCORD_WEBHOOK_INCOMPLETE_TASKS'),
      stuckTask: required('DISCORD_WEBHOOK_STUCK_TASKS'),
    },
  },
  redis: {
    url: required('REDIS_URL'),
    keyPrefix: 'clickup:notified',
    ttlSeconds: 604800, // 7 days
  },
  app: {
    cronSchedule: '*/10 * * * *', // Every 10 minutes
    newTask: {
      withinMinutes: 60, // 1 hour
    },
    stuckTask: {
      statuses: [STATUS.IN_PROGRESS, STATUS.CODE_REVIEW, STATUS.FEATURE_TEST],
      afterMinutes: 1440, // 24 hours
    },
  },
};
