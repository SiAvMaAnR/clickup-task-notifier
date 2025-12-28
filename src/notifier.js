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

  async processIncompleteTasks(tasks) {
    for (const task of tasks) {
      if (!this.isIncomplete(task)) {
        continue;
      }

      const alreadyNotified = await this.tracker.wasNotified(
        task.id,
        NOTIFICATION_TYPE.INCOMPLETE_TASK
      );

      if (!alreadyNotified) {
        await this.discord.sendIncompleteTasksNotification(task);
        await this.tracker.markNotified(task.id, NOTIFICATION_TYPE.INCOMPLETE_TASK);
      }
    }
  }

  async processStuckTasks(tasks) {
    for (const task of tasks) {
      const status = task.status?.status?.toLowerCase();

      if (!this.appConfig.stuckTask.statuses.includes(status)) {
        continue;
      }

      if (task.timeInStatus <= this.appConfig.stuckTask.afterMinutes) {
        continue;
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
  }

  async run() {
    const tasks = await this.clickup.getTasks().then((tasks) => this.attachTimeInStatus(tasks));
    
    console.log(`Fetched ${tasks.length} active tasks`);

    await this.processIncompleteTasks(tasks);
    await this.processStuckTasks(tasks);
  }
}
