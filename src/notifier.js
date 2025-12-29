import { NOTIFICATION_TYPE } from './constants.js';
import { logger } from './utils/logger.js';
import { TaskHelper } from './utils/task.helper.js';

export class Notifier {
  constructor(clickup, discord, tracker, appConfig) {
    this.clickup = clickup;
    this.discord = discord;
    this.tracker = tracker;
    this.taskHelper = new TaskHelper(appConfig);
  }

  async attachTimeInStatus(tasks) {
    const taskIds = tasks.map((t) => t.id);
    const timeData = await this.clickup.getBulkTimeInStatus(taskIds);

    return tasks.map((task) => ({
      ...task,
      timeInStatus: timeData[task.id]?.current_status?.total_time?.by_minute || 0,
    }));
  }

  async processNewTask(task) {
    const alreadyNotified = await this.tracker.wasNotified(task.id, NOTIFICATION_TYPE.NEW_TASK);

    if (!alreadyNotified) {
      await this.discord.sendNewTaskNotification(task);
      await this.tracker.markNotified(task.id, NOTIFICATION_TYPE.NEW_TASK);
    }
  }

  async processIncompleteTask(task) {
    const alreadyNotified = await this.tracker.wasNotified(
      task.id,
      NOTIFICATION_TYPE.INCOMPLETE_TASK
    );

    if (!alreadyNotified) {
      await this.discord.sendIncompleteTaskNotification(task);
      await this.tracker.markNotified(task.id, NOTIFICATION_TYPE.INCOMPLETE_TASK);
    }
  }

  async processStuckTask(task) {
    const alreadyNotified = await this.tracker.wasNotified(
      task.id,
      NOTIFICATION_TYPE.STUCK_TASK,
      task.status?.status
    );

    if (!alreadyNotified) {
      await this.discord.sendStuckTaskNotification(task);
      await this.tracker.markNotified(task.id, NOTIFICATION_TYPE.STUCK_TASK, task.status?.status);
    }
  }

  async processTask(task) {
    try {
      if (this.taskHelper.isIncomplete(task)) {
        await this.processIncompleteTask(task);
      }

      if (this.taskHelper.isNew(task)) {
        await this.processNewTask(task);
      }

      if (this.taskHelper.isStuck(task)) {
        await this.processStuckTask(task);
      }
    } catch (error) {
      logger.error(`Failed to process task ${task.id}:`, error.message);
    }
  }

  async run() {
    const tasks = await this.clickup.getTasks();

    if (tasks.length === 0) {
      return;
    }

    const adaptedTasks = await this.attachTimeInStatus(tasks);

    logger.info(`Fetched ${adaptedTasks.length} active tasks`);

    for (const task of adaptedTasks) {
      await this.processTask(task);
    }
  }
}
