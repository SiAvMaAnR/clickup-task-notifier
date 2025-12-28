import { NOTIFICATION_LABEL } from '../constants.js';
import { logger } from '../utils/logger.js';

export class DiscordClient {
  constructor(config, appConfig) {
    this.webhookUrl = config.webhook;
    this.appConfig = appConfig;
  }

  async sendWebhook(webhookUrl, content) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Discord webhook error: ${response.status} ${text}`);
      }

      return true;
    } catch (error) {
      logger.error('Discord webhook failed:', error.message);
      throw error;
    }
  }

  formatMessage(type, task) {
    const { name, status, assignees, url, timeInStatus } = task;
    const statusStr = status?.status || 'unknown';
    const assignee = assignees?.map((a) => a.username).join(', ') || 'not assigned';
    const timeStr = timeInStatus ? `${Math.floor(timeInStatus / 60)}h` : '-';

    return `**${type}** | ${name} | ${statusStr} | ${timeStr} | ${assignee} | <${url}>`;
  }

  async sendIncompleteTaskNotification(task) {
    await this.sendWebhook(
      this.webhookUrl.incompleteTask,
      this.formatMessage(NOTIFICATION_LABEL.INCOMPLETE_TASK, task)
    );
    logger.info(`Sent ${task.id} incomplete task notification`);
  }

  async sendStuckTaskNotification(task) {
    await this.sendWebhook(
      this.webhookUrl.stuckTask,
      this.formatMessage(NOTIFICATION_LABEL.STUCK_TASK, task)
    );
    logger.info(`Sent ${task.id} stuck task notification`);
  }
}
