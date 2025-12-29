export class TaskHelper {
  constructor(appConfig) {
    this.appConfig = appConfig;
  }

  isNew(task) {
    const ageMinutes = (Date.now() - Number(task.date_created)) / 1000 / 60;
    return ageMinutes <= this.appConfig.newTask.withinMinutes;
  }

  isIncomplete(task) {
    const noAssignee = !task.assignees || task.assignees.length === 0;
    const noPriority = !task.priority;
    const noEstimate = !task.time_estimate;
    return noAssignee || noPriority || noEstimate;
  }

  isStuck(task) {
    const status = task.status?.status?.toLowerCase();
    const isTargetStatus = this.appConfig.stuckTask.statuses.includes(status);
    const isOverTime = task.timeInStatus > this.appConfig.stuckTask.afterMinutes;
    return isTargetStatus && isOverTime;
  }
}
