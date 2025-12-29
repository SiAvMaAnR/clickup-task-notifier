export class ClickUpClient {
  constructor(config) {
    this.token = config.token;
    this.baseUrl = config.baseUrl;
    this.folderId = config.folderId;
  }

  async request(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: this.token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('ClickUp API request failed:', error.message);
      throw error;
    }
  }

  async getListId() {
    const { lists } = await this.request(`/folder/${this.folderId}/list`);

    if (lists.length === 0) {
      throw new Error('No lists found in folder');
    }

    return lists.at(-1).id;
  }

  async fetchPage(listId, page) {
    const data = await this.request(
      `/list/${listId}/task?include_closed=false&subtasks=false&page=${page}`
    );
    return data.tasks || [];
  }

  async getTasks() {
    const listId = await this.getListId();
    const tasks = [];

    for (let page = 0; ; page++) {
      const pageTasks = await this.fetchPage(listId, page);
      tasks.push(...pageTasks);

      if (pageTasks.length < 100) {
        break;
      }
    }

    return tasks;
  }

  async getBulkTimeInStatus(taskIds) {
    const queryString = taskIds.map((id) => `task_ids=${id}`).join('&');
    return this.request(`/task/bulk_time_in_status/task_ids?${queryString}`);
  }
}
