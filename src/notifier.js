import { NOTIFICATION_TYPE } from './constants.js';

export class Notifier {
  constructor(clickup, discord, tracker, appConfig) {
    this.clickup = clickup;
    this.discord = discord;
    this.tracker = tracker;
    this.appConfig = appConfig;
  }

  isIncomplete(task) {
    const noAssignee = !task.assignees || task.assignees.length === 0;
    const noPriority = !task.priority;
    const noEstimate = !task.time_estimate;
    return noAssignee || noPriority || noEstimate;
  }

  async attachTimeInStatus(tasks) {
    const taskIds = tasks.map((t) => t.id);
    const timeData = await this.clickup.getBulkTimeInStatus(taskIds);

    return tasks.map((task) => ({
      ...task,
      timeInStatus: timeData[task.id]?.current_status?.total_time?.by_minute || 0,
    }));
  }

  async processIncompleteTask(task) {
    if (!this.isIncomplete(task)) {
      return;
    }

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
    const status = task.status?.status?.toLowerCase();
    const isTargetStatus = this.appConfig.stuckTask.statuses.includes(status);
    const isStuck = task.timeInStatus > this.appConfig.stuckTask.afterMinutes;

    if (!isTargetStatus || !isStuck) {
      return;
    }

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
      await this.processIncompleteTask(task);
      await this.processStuckTask(task);
    } catch (error) {
      console.error(`Failed to process task ${task.id}:`, error.message);
    }
  }

  async run() {
    const tasks = await this.clickup.getTasks();

    if (tasks.length === 0) {
      return;
    }

    const adaptedTasks = await this.attachTimeInStatus(tasks);

    console.log(`Fetched ${adaptedTasks.length} active tasks`);

    for (const task of adaptedTasks) {
      await this.processTask(task);
    }
  }
}
